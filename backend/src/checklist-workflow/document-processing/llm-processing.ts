/**
 * LLMを使用したチェックリスト抽出処理
 */
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  getChecklistPageKey,
  getChecklistLlmOcrTextKey,
} from "../common/storage-paths";
import { ParsedChecklistItem, ProcessWithLLMResult } from "../common/types";
import { ulid } from "ulid";

// 使用するモデルIDを定義
const MODEL_ID = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"; // Sonnet 3.7

const BEDROCK_REGION = process.env.BEDROCK_REGION || "us-west-2";

export const CHECKLIST_EXTRACTION_PROMPT = `
あなたは技術文書、法律文書、表や図面から「チェックリスト」を抽出して構造化するAIアシスタントです。

## 概要
非構造化データから、チェックリスト項目を抽出し、階層構造も含めて構造化してください。

## 出力形式
厳密なJSON配列形式で出力してください。マークダウンの記法（\`\`\`json など）は使用せず、純粋なJSON配列のみを返してください。

重要: 必ず配列形式（[ ]で囲まれた形式）で出力してください。オブジェクト（{ }）ではなく配列を返してください。

各チェックリスト項目は以下のフィールドを含みます：

- name: チェック項目の名前
- description: チェック内容の詳細説明
- parent_id: 親項目の番号（最上位項目はnull）

## 抽出ルール
1. 単純なチェック項目とフローチャート型項目を識別してください
2. 階層構造は親子関係で表現してください（parent_id）
3. すべてのチェック項目を漏れなく抽出してください
4. 重複は排除し、整理してください
5. parent_id は数値で表現してください（0開始、最上位項目はnull）

## 例：正しい出力形式（配列）
[
  {
    "name": "契約当事者の記載",
    "description": "契約書に両当事者の正式名称が正確に記載されているか",
    "parent_id": 0
  },
  {
    "name": "特定された資産があるか",
    "description": "特定された資産があるか、当該判断においては、サプライヤーが使用期間全体を通じて資産を代替する実質上の能力を有するか考慮する",
    "parent_id": null
  }
]

## 注意事項
- 文書から抽出可能なすべての情報を含めてください
- 階層構造を正確に反映させてください
- 出力は厳密なJSON配列のみとし、説明文やマークダウン記法（\`\`\`json のようなコードブロック）は含めないでください
- 入力された文書の言語と同じ言語で出力してください
- parent_id は必ず数値（または最上位項目の場合はnull）で表現してください
- 必ず配列形式で出力してください。オブジェクトではなく配列を返してください

入力された文書から上記の形式でチェックリストを抽出し、JSON配列として返してください。
`;

export interface ProcessWithLLMParams {
  documentId: string;
  pageNumber: number;
}

/**
 * LLMを使用してチェックリストを抽出する
 * @param params LLM処理パラメータ
 * @returns 処理結果
 */
export async function processWithLLM({
  documentId,
  pageNumber,
}: ProcessWithLLMParams): Promise<ProcessWithLLMResult> {
  const s3Client = new S3Client({});
  const bedrockClient = new BedrockRuntimeClient({ region: BEDROCK_REGION });
  const bucketName = process.env.DOCUMENT_BUCKET || "";

  // PDFページを取得
  const pageKey = getChecklistPageKey(documentId, pageNumber, "pdf");
  console.log(`PDFページを取得: ${pageKey}`);
  const { Body } = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: pageKey,
    })
  );

  if (!Body) {
    throw new Error(`ページが見つかりません: ${pageKey}`);
  }

  // PDFをバイト配列として取得
  console.log(`PDFをバイト配列として取得: ${pageKey}`);
  const pdfBytes = await Body.transformToByteArray();
  console.log(`PDFのバイト配列を取得: ${pdfBytes.length} bytes`);

  console.log(
    `LLMにチェックリスト抽出をリクエスト: ${documentId}, ページ番号: ${pageNumber}`
  );
  const response = await bedrockClient.send(
    new ConverseCommand({
      modelId: MODEL_ID,
      messages: [
        {
          role: "user",
          content: [
            { text: CHECKLIST_EXTRACTION_PROMPT },
            {
              document: {
                name: "ChecklistDocument",
                format: "pdf",
                source: {
                  bytes: pdfBytes, // 実際のPDFバイナリデータ
                },
              },
            },
          ],
        },
      ],
      // additionalModelRequestFields: {
      //   thinking: {
      //     type: "enabled",
      //     budget_tokens: 4000, // 推論に使用する最大トークン数
      //   },
      // },
    })
  );

  // レスポンスからテキストを抽出
  console.log(`LLMからの応答を処理中...`);
  const outputMessage = response.output?.message;
  let llmResponse = "";
  if (outputMessage && outputMessage.content) {
    outputMessage.content.forEach((block) => {
      if ("text" in block) {
        llmResponse += block.text;
      }
    });
  }

  let checklistItems: ParsedChecklistItem[];
  try {
    // LLMの出力をJSONとしてパース
    checklistItems = JSON.parse(llmResponse);
    console.log(
      `LLMの応答をJSONとしてパースしました: ${JSON.stringify(checklistItems, null, 2)}`
    );

    // パース直後に各項目にIDを割り当て
    checklistItems = checklistItems.map((item) => ({
      ...item,
      id: ulid(),
    }));
  } catch (error) {
    console.error(
      `JSONパースに失敗しました: ${error}\nLLMの応答: ${llmResponse}`
    );
    console.error("リトライ処理を開始します。");
    // JSONパースに失敗した場合、エラーメッセージをBedrockに送ってリトライ
    const errorMessage = error instanceof Error ? error.message : String(error);
    const retryResponse = await bedrockClient.send(
      new ConverseCommand({
        modelId: MODEL_ID,
        messages: [
          {
            role: "user",
            content: [
              {
                text: `${CHECKLIST_EXTRACTION_PROMPT}\n\n前回の出力はJSONとしてパースできませんでした。エラー: ${errorMessage}\n\n厳密なJSON配列形式で出力してください。\n\nこれはPDFファイルのページ${pageNumber}です。チェックリストを抽出してください。`,
              },
              {
                document: {
                  name: "ChecklistDocument",
                  format: "pdf",
                  source: {
                    bytes: pdfBytes, // 実際のPDFバイナリデータ
                  },
                },
              },
            ],
          },
        ],
        // additionalModelRequestFields: {
        //   thinking: {
        //     type: "enabled",
        //     budget_tokens: 4000, // 推論に使用する最大トークン数
        //   },
        // },
      })
    );

    // リトライレスポンスからテキストを抽出
    const retryOutputMessage = retryResponse.output?.message;
    let retryLlmResponse = "";
    if (retryOutputMessage && retryOutputMessage.content) {
      retryOutputMessage.content.forEach((block) => {
        if ("text" in block) {
          retryLlmResponse += block.text;
        }
      });
    }
    try {
      checklistItems = JSON.parse(retryLlmResponse);

      // パース直後に各項目にIDを割り当て、数値型のIDを文字列に変換
      checklistItems = checklistItems.map((item) => {
        // 親IDを文字列に変換
        const parent_id =
          item.parent_id !== null && item.parent_id !== undefined
            ? String(item.parent_id)
            : null;

        return {
          ...item,
          id: ulid(),
          parent_id,
        };
      });
    } catch (error) {
      console.error(
        `リトライ後もJSONパースに失敗しました: ${error}\nLLMの応答: ${retryLlmResponse}`
      );
      throw new Error("LLMからの応答が無効です。");
    }
  }

  console.log(`LLMからの応答: ${JSON.stringify(checklistItems, null, 2)}`);

  const updatedChecklist = convertToUlid(checklistItems);

  // 結果をS3に保存
  const resultKey = getChecklistLlmOcrTextKey(documentId, pageNumber);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: resultKey,
      Body: JSON.stringify(checklistItems),
      ContentType: "application/json",
    })
  );

  return {
    documentId,
    pageNumber,
  };
}

function convertToUlid(
  checklistItems: ParsedChecklistItem[]
): ParsedChecklistItem[] {
  // 型定義を追加
  const idMapping: { [key: string]: string } = {};

  // 各項目のIDをマッピング
  checklistItems.forEach((item) => {
    // IDはすでに割り当て済みなので、マッピングのみ行う
    idMapping[item.id] = item.id;

    if (item.parent_id !== null) {
      if (!idMapping[item.parent_id]) {
        idMapping[item.parent_id] = ulid();
      }
    }
  });

  // 各項目を変換
  const convertedItems = checklistItems.map((item) => {
    // 新しいアイテムを作成
    const newItem: ParsedChecklistItem = {
      ...item,
      // IDはすでに割り当て済み
    };

    // parent_idを変換（nullでない場合のみ）
    if (newItem.parent_id !== null) {
      newItem.parent_id = idMapping[newItem.parent_id];
    }

    return newItem;
  });

  return convertedItems;
}
