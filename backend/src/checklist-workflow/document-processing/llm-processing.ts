/**
 * LLMを使用したチェックリスト抽出処理
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { getChecklistPageKey, getChecklistLlmOcrTextKey } from "../common/storage-paths";
import { ChecklistItem, ProcessWithLLMResult } from "../common/types";

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
  const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" }); // 適切なリージョンに変更
  const bucketName = process.env.DOCUMENT_BUCKET || '';
  
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

  // PDFをBase64エンコード
  const pdfBytes = await Body.transformToByteArray();
  const base64Pdf = Buffer.from(pdfBytes).toString('base64');
  
  // Bedrock Converse APIを呼び出し
  const response = await bedrockClient.send(
    new InvokeModelCommand({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0", // Sonnet 3.7
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: CHECKLIST_EXTRACTION_PROMPT
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64Pdf
                }
              }
            ]
          }
        ]
      })
    })
  );

  // レスポンスをパース
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const llmResponse = responseBody.content[0].text;
  
  let checklistItems: ChecklistItem[];
  try {
    // LLMの出力をJSONとしてパース
    checklistItems = JSON.parse(llmResponse);
  } catch (error) {
    // JSONパースに失敗した場合、エラーメッセージをBedrockに送ってリトライ
    const errorMessage = error instanceof Error ? error.message : String(error);
    const retryResponse = await bedrockClient.send(
      new InvokeModelCommand({
        modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `${CHECKLIST_EXTRACTION_PROMPT}\n\n前回の出力はJSONとしてパースできませんでした。エラー: ${errorMessage}\n\n厳密なJSON配列形式で出力してください。`
                },
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: base64Pdf
                  }
                }
              ]
            }
          ]
        })
      })
    );
    
    const retryBody = JSON.parse(new TextDecoder().decode(retryResponse.body));
    const retryLlmResponse = retryBody.content[0].text;
    checklistItems = JSON.parse(retryLlmResponse);
  }
  
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
    checklistItems,
  };
}
