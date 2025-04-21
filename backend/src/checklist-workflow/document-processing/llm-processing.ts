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
import { ChecklistItem, ProcessWithLLMResult } from "../common/types";
import { ulid } from "ulid";

// 使用するモデルIDを定義
// const MODEL_ID = "us.anthropic.claude-3-sonnet-20240229-v1:0";
const MODEL_ID = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"; // Sonnet 3.7
// const MODEL_ID = "us.anthropic.claude-3-5-haiku-20241022-v1:0";  // Haiku 3.5

const BEDROCK_REGION = process.env.BEDROCK_REGION || "us-west-2";

export const CHECKLIST_EXTRACTION_PROMPT = `
あなたは技術文書、法律文書、表や図面から「チェックリスト」を抽出して構造化するAIアシスタントです。

## 概要
非構造化データから、チェックリスト項目を抽出し、階層構造やフローチャート型の判断フローも含めて構造化してください。

## 出力形式
厳密なJSON配列形式で出力してください。マークダウンの記法（\`\`\`json など）は使用せず、純粋なJSON配列のみを返してください。

重要: 必ず配列形式（[ ]で囲まれた形式）で出力してください。オブジェクト（{ }）ではなく配列を返してください。

各チェックリスト項目は以下のフィールドを含みます：

- name: チェック項目の名前
- description: チェック内容の詳細説明
- parent_id: 親項目の番号（最上位項目はnull）
- item_type: "SIMPLE"（単純なチェック項目）または"FLOW"（フローチャート型項目）
- is_conclusion: 結論項目かどうか（boolean）
- flow_data: フローチャート型項目の場合のみ設定（JSON object）
  * condition_type: "YES_NO"または"MULTI_CHOICE"
  * next_if_yes: "YES"の場合の次項目番号（YES/NO形式の場合）
  * next_if_no: "NO"の場合の次項目番号（YES/NO形式の場合）
  * next_options: 複数選択肢の場合の選択肢と次項目のマッピング

## 抽出ルール
1. 単純なチェック項目とフローチャート型項目を識別してください
2. 階層構造は親子関係で表現してください（parent_id）
3. フローチャート型項目では条件分岐を明確にしてください
4. 法的参照情報がある場合は description に含めてください
5. すべてのチェック項目を漏れなく抽出してください
6. 重複は排除し、整理してください
7. parent_id は数値で表現してください（0開始、最上位項目はnull）

## 例：正しい出力形式（配列）
[
  {
    "name": "契約当事者の記載",
    "description": "契約書に両当事者の正式名称が正確に記載されているか",
    "parent_id": 0,
    "item_type": "SIMPLE",
    "is_conclusion": false,
    "flow_data": null
  },
  {
    "name": "特定された資産があるか",
    "description": "特定された資産があるか、当該判断においては、サプライヤーが使用期間全体を通じて資産を代替する実質上の能力を有するか考慮する",
    "parent_id": null,
    "item_type": "FLOW",
    "is_conclusion": false,
    "flow_data": {
      "condition_type": "YES_NO",
      "next_if_yes": 2,
      "next_if_no": 10
    }
  }
]

## 注意事項
- 文書から抽出可能なすべての情報を含めてください
- 階層構造とフロー構造を正確に反映させてください
- 関連する法的参照があれば必ず含めてください
- 出力は厳密なJSON配列のみとし、説明文やマークダウン記法（\`\`\`json のようなコードブロック）は含めないでください
- フローチャート構造が存在する場合は特に注意して抽出してください
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
  const pdfBytes = await Body.transformToByteArray();
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
  const outputMessage = response.output?.message;
  let llmResponse = "";
  if (outputMessage && outputMessage.content) {
    outputMessage.content.forEach((block) => {
      if ("text" in block) {
        llmResponse += block.text;
      }
    });
  }

  let checklistItems: ChecklistItem[];
  try {
    // LLMの出力をJSONとしてパース
    checklistItems = JSON.parse(llmResponse);
    
    // パース直後に各項目にIDを割り当て
    checklistItems = checklistItems.map(item => ({
      ...item,
      id: ulid()
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
      
      // パース直後に各項目にIDを割り当て
      checklistItems = checklistItems.map(item => ({
        ...item,
        id: ulid()
      }));
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

function convertToUlid(checklistItems: ChecklistItem[]): ChecklistItem[] {
  // 型定義を追加
  const idMapping: { [key: string | number]: string } = {};

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
    const newItem: ChecklistItem = {
      ...item,
      // IDはすでに割り当て済み
    };

    // parent_idを変換（nullでない場合のみ）
    if (newItem.parent_id !== null) {
      newItem.parent_id = idMapping[newItem.parent_id];
    }

    // flow_dataの変換（存在する場合のみ）
    if (newItem.flow_data) {
      // next_if_yesの変換
      if (
        typeof newItem.flow_data.next_if_yes !== "undefined" &&
        newItem.flow_data.next_if_yes !== null &&
        idMapping[newItem.flow_data.next_if_yes]
      ) {
        newItem.flow_data.next_if_yes =
          idMapping[newItem.flow_data.next_if_yes];
      }

      // next_if_noの変換
      if (
        typeof newItem.flow_data.next_if_no !== "undefined" &&
        newItem.flow_data.next_if_no !== null &&
        idMapping[newItem.flow_data.next_if_no]
      ) {
        newItem.flow_data.next_if_no = idMapping[newItem.flow_data.next_if_no];
      }

      // next_optionsの変換
      if (newItem.flow_data.next_options) {
        // 新しいnext_optionsオブジェクトを作成
        const newNextOptions: Record<string, string | number> = {};

        // 各オプションを処理
        Object.entries(newItem.flow_data.next_options).forEach(
          ([key, value]) => {
            if (value !== null && idMapping[value]) {
              newNextOptions[key] = idMapping[value];
            } else {
              // マッピングがない場合は元の値を保持
              newNextOptions[key] = value;
            }
          }
        );

        // 変換後の値で更新
        newItem.flow_data.next_options = newNextOptions;
      }
    }

    return newItem;
  });

  return convertedItems;
}
