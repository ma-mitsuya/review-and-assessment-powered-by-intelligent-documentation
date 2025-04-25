"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// test-bedrock-review.ts
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// モデルID
const MODEL_ID = "us.anthropic.claude-3-7-sonnet-20250219-v1:0";
// 審査プロンプトテンプレート
const REVIEW_PROMPT = `
あなたは不動産書類の審査を行うAIアシスタントです。
以下のチェック項目に基づいて、提供された書類を審査してください。

チェック項目: {checkName}
説明: {checkDescription}

書類の内容:
{documentContent}

このチェック項目に対して、書類が適合しているかどうかを判断し、以下の形式でJSON形式で回答してください。
JSON「以外」の文字列を出力することは厳禁です。マークダウンの記法（\`\`\`json など）は使用せず、純粋なJSONのみを返してください。

{
  "result": "pass" または "fail",
  "confidence": 0から1の間の数値（信頼度）,
  "explanation": "判断理由の説明",
  "extractedText": "関連する抽出テキスト"
}
`;
/**
 * 単一のチェック項目をテストする
 */
async function testSingleCheckItem(documentPath, checkItem) {
    try {
        // ローカルファイルからドキュメントを取得
        const documentBytes = new Uint8Array(fs.readFileSync(documentPath));
        const fileExt = path.extname(documentPath).substring(1).toLowerCase();
        // PDFファイル以外はサポートしない
        if (fileExt !== "pdf") {
            throw new Error(`サポートしていないファイル形式です: ${fileExt}. 現在はPDFのみサポートしています。`);
        }
        // プロンプトの準備
        const prompt = REVIEW_PROMPT.replace("{checkName}", checkItem.name).replace("{checkDescription}", checkItem.description || "説明なし");
        console.log(`\n===== チェック項目: ${checkItem.name} =====`);
        console.log(`説明: ${checkItem.description}`);
        // Bedrockを使用して審査
        const bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: process.env.AWS_REGION || "us-west-2",
        });
        console.log("Bedrockを呼び出し中...");
        const startTime = Date.now();
        const response = await bedrockClient.send(new client_bedrock_runtime_1.ConverseCommand({
            modelId: MODEL_ID,
            messages: [
                {
                    role: "user",
                    content: [
                        { text: prompt },
                        {
                            document: {
                                name: "ReviewDocument",
                                format: fileExt,
                                source: {
                                    bytes: documentBytes,
                                },
                            },
                        },
                    ],
                },
            ],
        }));
        const endTime = Date.now();
        console.log(`処理時間: ${(endTime - startTime) / 1000}秒`);
        // レスポンスからテキストを抽出
        let llmResponse = "";
        if (response.output?.message?.content) {
            response.output.message.content.forEach((block) => {
                if ("text" in block) {
                    llmResponse += block.text;
                }
            });
        }
        // JSONレスポンスを抽出
        const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
        let reviewData;
        if (jsonMatch) {
            try {
                reviewData = JSON.parse(jsonMatch[0]);
                console.log(`結果: ${reviewData.result} (信頼度: ${reviewData.confidence})`);
                // 結果オブジェクトに元のチェック項目情報を追加
                return {
                    ...reviewData,
                    checkItem: {
                        id: checkItem.id,
                        name: checkItem.name,
                        description: checkItem.description,
                    },
                    rawResponse: llmResponse,
                    processingTimeMs: endTime - startTime,
                };
            }
            catch (error) {
                console.error("JSONパース失敗:", error);
                return {
                    error: "JSONパース失敗",
                    checkItem: checkItem,
                    rawResponse: llmResponse,
                    processingTimeMs: endTime - startTime,
                };
            }
        }
        else {
            console.error("JSONレスポンスが見つかりません");
            return {
                error: "JSONレスポンスなし",
                checkItem: checkItem,
                rawResponse: llmResponse,
                processingTimeMs: endTime - startTime,
            };
        }
    }
    catch (error) {
        console.error(`エラー発生 (${checkItem.name}):`, error.message);
        return {
            error: error.message,
            checkItem: checkItem,
        };
    }
}
/**
 * 複数のチェック項目に対してテストを実行
 */
async function testBedrockReview(config) {
    const results = [];
    console.log(`===== テスト実行開始 =====`);
    console.log(`ドキュメント: ${config.documentPath}`);
    console.log(`チェック項目数: ${config.checkItems.length}`);
    const startTime = Date.now();
    // 各チェック項目ごとにテスト実行
    for (const checkItem of config.checkItems) {
        const result = await testSingleCheckItem(config.documentPath, checkItem);
        results.push(result);
    }
    const endTime = Date.now();
    console.log(`\n===== テスト完了 =====`);
    console.log(`合計所要時間: ${(endTime - startTime) / 1000}秒`);
    return results;
}
// チェックリスト項目をJSONファイルから読み込む
function loadCheckItems(filePath) {
    try {
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data);
    }
    catch (error) {
        console.error(`チェックリスト項目の読み込みに失敗しました: ${error.message}`);
        return [];
    }
}
/**
 * メイン関数
 */
async function main() {
    const args = process.argv.slice(2);
    let documentPath = "";
    let checkListPath = "";
    let outputDir = "./results";
    // コマンドライン引数の処理
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace("--", "");
        const value = args[i + 1];
        if (key === "document") {
            documentPath = value;
        }
        else if (key === "checklist") {
            checkListPath = value;
        }
        else if (key === "output") {
            outputDir = value;
        }
    }
    // 必須パラメータの確認
    if (!documentPath || !checkListPath) {
        console.error("使用方法: node test-bedrock-review.js --document <文書パス> --checklist <チェックリストJSONパス> [--output <結果出力ディレクトリ>]");
        process.exit(1);
    }
    // ドキュメントが存在するか確認
    if (!fs.existsSync(documentPath)) {
        console.error(`ドキュメントが見つかりません: ${documentPath}`);
        process.exit(1);
    }
    // チェックリストJSONファイルが存在するか確認
    if (!fs.existsSync(checkListPath)) {
        console.error(`チェックリストJSONファイルが見つかりません: ${checkListPath}`);
        process.exit(1);
    }
    // 出力ディレクトリがなければ作成
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    // チェックリスト項目の読み込み
    const checkItems = loadCheckItems(checkListPath);
    if (checkItems.length === 0) {
        console.error("チェックリスト項目が見つかりませんでした");
        process.exit(1);
    }
    // テスト設定
    const config = {
        documentPath,
        checkItems,
        outputDir,
    };
    // テスト実行
    const results = await testBedrockReview(config);
    // 結果をファイルに保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const documentName = path.basename(documentPath, path.extname(documentPath));
    const outputFileName = `${outputDir}/${documentName}_results_${timestamp}.json`;
    fs.writeFileSync(outputFileName, JSON.stringify({
        documentPath,
        testDate: new Date().toISOString(),
        results,
    }, null, 2));
    console.log(`テスト結果を保存しました: ${outputFileName}`);
    // サマリーの表示
    const passCount = results.filter((r) => r.result === "pass").length;
    const failCount = results.filter((r) => r.result === "fail").length;
    const errorCount = results.filter((r) => r.error).length;
    console.log(`\n===== 結果サマリー =====`);
    console.log(`合格: ${passCount}`);
    console.log(`不合格: ${failCount}`);
    console.log(`エラー: ${errorCount}`);
}
main().catch(console.error);
