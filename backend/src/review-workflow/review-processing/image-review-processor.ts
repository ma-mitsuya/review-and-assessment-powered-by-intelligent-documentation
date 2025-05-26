import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  TokenUsage,
} from "@aws-sdk/client-bedrock-runtime";
import {
  makePrismaReviewJobRepository,
  makePrismaReviewResultRepository,
} from "../../api/features/review/domain/repository";
import {
  REVIEW_JOB_STATUS,
  ReviewResultDomain,
} from "../../api/features/review/domain/model/review";
import { makePrismaCheckRepository } from "../../api/features/checklist/domain/repository";

// 使用するモデル ID を定義
const MODEL_ID = "us.amazon.nova-premier-v1:0"; // Amazon Nova Premier クロスリージョン推論プロファイル

const BEDROCK_REGION = process.env.BEDROCK_REGION || "us-west-2";

// 審査プロンプト (画像用)
const IMAGE_REVIEW_PROMPT = `
あなたは不動産書類の審査を行う AI アシスタントです。
以下のチェック項目に基づいて、提供された画像を審査してください。

チェック項目: {checkName}
説明: {checkDescription}

画像の内容を確認し、このチェック項目に対して適合しているかどうかを判断してください。
JSON「以外」の文字列を出力することは厳禁です。マークダウンの記法（\`\`\`json など）は使用せず、純粋な JSON のみを返してください。

{
"result": "pass" または "fail",
"confidence": 0 から 1 の間の数値（信頼度）,
"explanation": "判断理由の説明",
"extractedText": "関連する抽出テキスト",
"imageIndex": 判断に使用した画像のインデックス（0から始まる整数、複数の場合はカンマ区切りで記載）
}
`;

/**
 * 画像審査項目処理パラメータ
 */
interface ProcessImageReviewItemParams {
  reviewJobId: string;
  documentId: string;
  checkId: string;
  reviewResultId: string;
}

/**
 * 画像審査項目を処理する
 * @param params 処理パラメータ
 * @returns 処理結果
 */
export async function processImageReviewItem(
  params: ProcessImageReviewItemParams
): Promise<any> {
  const { reviewJobId, documentId, checkId, reviewResultId } = params;
  const reviewJobRepository = await makePrismaReviewJobRepository();
  const reviewResultRepository = await makePrismaReviewResultRepository();
  const checkRepository = await makePrismaCheckRepository();

  try {
    // チェックリスト項目の取得
    const checkList = await checkRepository.findCheckListItemById(checkId);

    if (!checkList) {
      throw new Error(`Check list item not found: ${checkId}`);
    }

    // ReviewJobに関連するすべてのReviewDocumentを取得
    const job = await reviewJobRepository.findReviewJobById({
      reviewJobId,
    });

    if (!job) {
      throw new Error(`Review job not found: ${reviewJobId}`);
    }

    // S3から画像ファイルを取得
    const s3Client = new S3Client({});
    const bucketName = process.env.DOCUMENT_BUCKET || "";

    // ジョブに関連するドキュメントを取得
    if (!job.documents || job.documents.length === 0) {
      throw new Error(`No documents found for review job: ${reviewJobId}`);
    }

    // 最大20枚までの画像を取得
    const imageBuffers = await Promise.all(
      job.documents.slice(0, 20).map(async (doc) => {
        const { Body } = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: doc.s3Path,
          })
        );

        if (!Body) {
          throw new Error(`Image not found: ${doc.s3Path}`);
        }

        return {
          filename: doc.filename,
          buffer: await Body.transformToByteArray(),
        };
      })
    );

    // プロンプトの準備
    const prompt = IMAGE_REVIEW_PROMPT.replace(
      "{checkName}",
      checkList.name
    ).replace("{checkDescription}", checkList.description || "説明なし");

    // Bedrockを使用して審査
    const bedrockClient = new BedrockRuntimeClient({
      region: BEDROCK_REGION,
    });

    // メッセージの構築
    const messageContent: any[] = [{ text: prompt }];

    // 画像をメッセージに追加
    imageBuffers.forEach((img) => {
      const fileExtension = img.filename.split(".").pop()?.toLowerCase();
      const format = fileExtension === "png" ? "png" : "jpeg";

      messageContent.push({
        image: {
          format,
          source: {
            bytes: img.buffer,
          },
        },
      });
    });

    const response = await bedrockClient.send(
      new ConverseCommand({
        modelId: MODEL_ID,
        messages: [
          {
            role: "user" as const,
            content: messageContent,
          },
        ],
        inferenceConfig: {
          maxTokens: 1000,
          temperature: 0.2,
          topP: 0.9,
        },
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
    const inputTokens = usage?.inputTokens || 0;
    const latencyMs = response.metrics?.latencyMs || 0;

    console.log(
      `[画像審査] 入力トークン: ${inputTokens}, レイテンシー: ${latencyMs}ms, 審査項目ID: ${checkId}`
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

前回の応答を JSON として解析できませんでした。必ず有効な JSON オブジェクトのみを返してください。
マークダウンの記法（\`\`\`json など）は使用せず、純粋な JSON のみを返してください。
`;

        // リトライメッセージの構築
        const retryMessageContent: any[] = [{ text: retryPrompt }];

        // 画像をリトライメッセージに追加
        imageBuffers.forEach((img) => {
          const fileExtension = img.filename.split(".").pop()?.toLowerCase();
          const format = fileExtension === "png" ? "png" : "jpeg";

          retryMessageContent.push({
            image: {
              format,
              source: {
                bytes: img.buffer,
              },
            },
          });
        });

        const retryResponse = await bedrockClient.send(
          new ConverseCommand({
            modelId: MODEL_ID,
            messages: [
              {
                role: "user" as const,
                content: retryMessageContent,
              },
            ],
            inferenceConfig: {
              maxTokens: 1000,
              temperature: 0.2,
              topP: 0.9,
            },
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
      sourceReferences: ReviewResultDomain.parseSourceReferences(documentId, reviewData.imageIndex),
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
    console.error(
      `Error processing image review item ${reviewResultId}:`,
      error
    );

    // エラー発生時は審査結果のステータスを失敗に更新
    await reviewJobRepository.updateJobStatus({
      reviewJobId,
      status: REVIEW_JOB_STATUS.FAILED,
    });
    throw error;
  }
}
