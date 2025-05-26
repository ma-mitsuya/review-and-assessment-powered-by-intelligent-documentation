import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  TokenUsage,
} from "@aws-sdk/client-bedrock-runtime";
import { getReviewDocumentKey } from "../../checklist-workflow/common/storage-paths";
import {
  makePrismaReviewJobRepository,
  makePrismaReviewResultRepository,
} from "../../api/features/review/domain/repository";
import {
  REVIEW_FILE_TYPE,
  REVIEW_JOB_STATUS,
  ReviewResultDomain,
} from "../../api/features/review/domain/model/review";
import { makePrismaCheckRepository } from "../../api/features/checklist/domain/repository";
import { processImageReviewItem } from "./image-review-processor";

// 使用するモデルIDを定義
const MODEL_ID = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"; // Sonnet 3.7

const BEDROCK_REGION = process.env.BEDROCK_REGION || "us-west-2";

// 審査プロンプト
const REVIEW_PROMPT = `
あなたはドキュメントの審査を行うAIアシスタントです。
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
  "extractedText": "関連する抽出テキスト",
  "pageNumber": 抽出テキストが記載されているページ番号（1から始まる整数）
}

信頼度スコアの例:
- 高い信頼度 (0.9-1.0): 書類に明確な記載があり、チェック項目との適合性が明らかな場合
- 中程度の信頼度 (0.7-0.89): 書類に関連する記載はあるが、完全に明確ではない場合
- 低い信頼度 (0.5-0.69): 書類の記載が曖昧で、判断に不確実性がある場合

出力例1 (高い信頼度でパス):
{
  "result": "pass",
  "confidence": 0.95,
  "explanation": "契約書第3条に契約者の氏名、住所、連絡先が明確に記載されています。すべての必要情報が含まれており、正確です。",
  "extractedText": "第3条（契約者情報）契約者：山田太郎、住所：東京都千代田区...",
  "pageNumber": 2
}

出力例2 (中程度の信頼度で失敗):
{
  "result": "fail",
  "confidence": 0.82,
  "explanation": "契約書に物件の所在地は記載されていますが、面積の記載が見当たりません。チェック項目では面積の記載が必要とされています。",
  "extractedText": "物件所在地：東京都新宿区西新宿1-1-1",
  "pageNumber": 1
}

出力例3 (低い信頼度でパス):
{
  "result": "pass",
  "confidence": 0.65,
  "explanation": "契約書に支払条件の記載はありますが、具体的な支払日の記載が曖昧です。ただし最低限の条件は満たしていると判断します。",
  "extractedText": "代金は契約締結後、速やかに支払うものとする。",
  "pageNumber": 3
}
`;

/**
 * 審査項目処理パラメータ
 */
interface ProcessReviewItemParams {
  reviewJobId: string;
  checkId: string;
  reviewResultId: string;
}

/**
 * 審査項目を処理する
 * @param params 処理パラメータ
 * @returns 処理結果
 */
export async function processReviewItem(
  params: ProcessReviewItemParams
): Promise<any> {
  const { reviewJobId, checkId, reviewResultId } = params;
  const reviewJobRepository = await makePrismaReviewJobRepository();

  // ジョブに関連するドキュメント情報を取得
  const jobDetail = await reviewJobRepository.findReviewJobById({
    reviewJobId,
  });

  if (!jobDetail.documents || jobDetail.documents.length === 0) {
    throw new Error(`No documents found for review job ${reviewJobId}`);
  }

  // ドキュメントタイプによって処理を分岐
  // 同じタイプのドキュメントをグループ化
  const imageDocuments = jobDetail.documents.filter(
    (doc) => doc.fileType === REVIEW_FILE_TYPE.IMAGE
  );
  const pdfDocuments = jobDetail.documents.filter(
    (doc) => doc.fileType === REVIEW_FILE_TYPE.PDF
  );

  // 画像ドキュメントがある場合
  if (imageDocuments.length > 0) {
    return processImageReviewItem({
      reviewJobId: params.reviewJobId,
      documents: imageDocuments,
      checkId: params.checkId,
      reviewResultId: params.reviewResultId,
    });
    // PDFドキュメントがある場合
  } else if (pdfDocuments.length > 0) {
    return processPdfReviewItem({
      reviewJobId,
      documents: pdfDocuments,
      checkId,
      reviewResultId,
    });
  } else {
    throw new Error(
      `No supported documents found for review job ${reviewJobId}`
    );
  }
}

/**
 * PDF 審査項目を処理する
 * @param params 処理パラメータ
 * @returns 処理結果
 */
async function processPdfReviewItem(params: {
  reviewJobId: string;
  documents: Array<{
    id: string;
    filename: string;
    s3Path: string;
    fileType: string;
  }>;
  checkId: string;
  reviewResultId: string;
}): Promise<any> {
  const { reviewJobId, documents, checkId, reviewResultId } = params;
  const reviewResultRepository = await makePrismaReviewResultRepository();
  const checkRepository = await makePrismaCheckRepository();

  try {
    // チェックリスト項目の取得
    const checkList = await checkRepository.findCheckListItemById(checkId);

    if (!checkList) {
      throw new Error(`Check list item not found: ${checkId}`);
    }

    // S3からドキュメントを取得
    const s3Client = new S3Client({});
    const bucketName = process.env.DOCUMENT_BUCKET || "";

    // 複数のPDFをロード
    const pdfContents = await Promise.all(
      documents.map(async (document) => {
        const s3Key = document.s3Path;
        const { Body } = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
          })
        );

        if (!Body) {
          throw new Error(`Document not found: ${s3Key}`);
        }

        // ファイル拡張子を取得
        const fileExtension = document.filename.split(".").pop()?.toLowerCase();

        // PDFのみサポート
        if (fileExtension !== "pdf") {
          throw new Error(
            `Unsupported file format: ${fileExtension}. Only PDF is supported.`
          );
        }

        // ドキュメントをバイト配列として取得
        const documentBytes = await Body.transformToByteArray();
        return {
          documentId: document.id,
          filename: document.filename,
          bytes: documentBytes,
        };
      })
    );

    // プロンプトの準備
    const prompt = REVIEW_PROMPT.replace("{checkName}", checkList.name).replace(
      "{checkDescription}",
      checkList.description || "説明なし"
    );

    // Bedrockを使用して審査
    const bedrockClient = new BedrockRuntimeClient({
      region: BEDROCK_REGION,
    });

    // 複数のPDFをコンテンツとして追加
    const pdfContentsForBedrock = pdfContents.map((pdf) => ({
      document: {
        name: pdf.filename,
        format: "pdf",
        source: {
          bytes: pdf.bytes,
        },
      },
    }));

    const response = await bedrockClient.send(
      new ConverseCommand({
        modelId: MODEL_ID,
        messages: [
          {
            role: "user",
            content: [
              { text: prompt },
              ...pdfContentsForBedrock.map((content) => content as any),
            ],
          },
        ],
      })
    );

    // レスポンスからテキストを抽出
    let llmResponse = "";
    if (response.output?.message?.content) {
      response.output.message.content.forEach((block) => {
        if ("text" in block) {
          llmResponse += block.text;
        }
      });
    }

    // キャッシュメトリクスのログ出力
    const usage = response.usage as TokenUsage;
    const cacheReadTokens = usage?.cacheReadInputTokens || 0;
    const cacheWriteTokens = usage?.cacheWriteInputTokens || 0;
    const inputTokens = usage?.inputTokens || 0;
    const latencyMs = response.metrics?.latencyMs || 0;

    let cacheStatus = "未使用";
    if (cacheReadTokens > 0) {
      cacheStatus = "ヒット";
    } else if (cacheWriteTokens > 0) {
      cacheStatus = "作成";
    }

    console.log(
      `[プロンプトキャッシュ] 状態: ${cacheStatus}, 読取: ${cacheReadTokens}, 書込: ${cacheWriteTokens}, 入力: ${inputTokens}, レイテンシー: ${latencyMs}ms, 審査項目ID: ${checkId}`
    );

    // JSONレスポンスを抽出
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    let reviewData;

    if (jsonMatch) {
      try {
        reviewData = JSON.parse(jsonMatch[0]);
      } catch (error) {
        // JSONパースに失敗した場合、リトライ
        console.error("JSONパースに失敗しました。リトライします。");

        // リトライ用のプロンプト
        const retryPrompt = `
${prompt}

前回の応答をJSONとして解析できませんでした。必ず有効なJSONオブジェクトのみを返してください。
マークダウンの記法（\`\`\`json など）は使用せず、純粋なJSONのみを返してください。
`;

        // リトライ時も複数のPDFをコンテンツとして追加
        const retryResponse = await bedrockClient.send(
          new ConverseCommand({
            modelId: MODEL_ID,
            messages: [
              {
                role: "user",
                content: [
                  { text: retryPrompt },
                  ...pdfContentsForBedrock.map((content) => content as any),
                ],
              },
            ],
          })
        );

        // リトライレスポンスからテキストを抽出
        let retryLlmResponse = "";
        if (retryResponse.output?.message?.content) {
          retryResponse.output.message.content.forEach((block) => {
            if ("text" in block) {
              retryLlmResponse += block.text;
            }
          });
        }

        // リトライ時のキャッシュメトリクスのログ出力
        const retryUsage = retryResponse.usage as TokenUsage;
        const retryCacheReadTokens = retryUsage?.cacheReadInputTokens || 0;
        const retryCacheWriteTokens = retryUsage?.cacheWriteInputTokens || 0;
        const retryInputTokens = retryUsage?.inputTokens || 0;
        const retryLatencyMs = retryResponse.metrics?.latencyMs || 0;

        let retryCacheStatus = "未使用";
        if (retryCacheReadTokens > 0) {
          retryCacheStatus = "ヒット";
        } else if (retryCacheWriteTokens > 0) {
          retryCacheStatus = "作成";
        }

        console.log(
          `[プロンプトキャッシュ(リトライ)] 状態: ${retryCacheStatus}, 読取: ${retryCacheReadTokens}, 書込: ${retryCacheWriteTokens}, 入力: ${retryInputTokens}, レイテンシー: ${retryLatencyMs}ms, 審査項目ID: ${checkId}`
        );

        const retryJsonMatch = retryLlmResponse.match(/\{[\s\S]*\}/);
        if (!retryJsonMatch) {
          throw new Error("リトライ後もJSONレスポンスを抽出できませんでした。");
        }

        reviewData = JSON.parse(retryJsonMatch[0]);
      }
    } else {
      throw new Error("JSONレスポンスを抽出できませんでした。");
    }

    // 審査結果を更新
    const current = await reviewResultRepository.findDetailedReviewResultById({
      resultId: reviewResultId,
    });
    const updated = ReviewResultDomain.fromLlmReviewData({
      current,
      result: reviewData.result,
      confidenceScore: reviewData.confidence,
      explanation: reviewData.explanation,
      extractedText: reviewData.extractedText,
      sourceReferences: pdfContents.map((pdf) => ({
        documentId: pdf.documentId,
        pageNumber: reviewData.pageNumber,
      })),
    });
    await reviewResultRepository.updateResult({
      newResult: updated,
    });

    return {
      status: "success",
      reviewResultId,
      checkId,
      result: reviewData.result,
    };
  } catch (error) {
    console.error(`Error processing review item ${reviewResultId}:`, error);
    throw error;
  }
}
