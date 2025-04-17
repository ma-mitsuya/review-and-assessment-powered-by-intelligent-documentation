// local-test.js
import fs from "fs";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const BEDROCK_REGION = "us-west-2"; // AWSのリージョンを指定
// const MODEL_ID = "us.anthropic.claude-3-sonnet-20240229-v1:0"; // 使用するモデルIDを指定
const MODEL_ID = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"; // Sonnet 3.7
// const MODEL_ID = "us.anthropic.claude-3-5-haiku-20241022-v1:0"; // Haiku 3.5

// LLMのプロンプト
const CHECKLIST_EXTRACTION_PROMPT = `
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

// コマンドライン引数からPDFファイルのパスを取得
const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error("使用方法: node local-test.js <PDFのパス>");
  process.exit(1);
}

async function processWithLocalLLM() {
  try {
    console.log(`PDFファイル "${pdfPath}" を処理中...`);

    // PDFファイルを読み込み
    const pdfBytes = fs.readFileSync(pdfPath);

    // Bedrockクライアントを初期化
    const bedrockClient = new BedrockRuntimeClient({
      region: BEDROCK_REGION,
    });

    console.log("BedrockにPDFを送信中...");
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
                    bytes: pdfBytes, // ローカルから読み込んだPDFバイナリデータ
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

    console.log("\n== 生のLLMレスポンス ==\n");
    console.log(llmResponse);

    // JSON解析を試みる
    try {
      console.log("\n== JSONとして解析した結果 ==\n");
      const checklistItems = JSON.parse(llmResponse);
      console.log(JSON.stringify(checklistItems, null, 2));
    } catch (error) {
      console.error("\nJSON解析エラー:", error.message);
      console.log(
        "\n== JSON解析に失敗しました。LLMからの出力を修正する必要があります =="
      );
    }
  } catch (error) {
    console.error("処理エラー:", error);
  }
}

// スクリプトを実行
processWithLocalLLM();
