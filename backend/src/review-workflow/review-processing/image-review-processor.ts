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
Here's the English translation of the prompt, ensuring that explanation and label are still output in Japanese:

You are an AI assistant who reviews documents.
Please review the provided image based on the following check items.

Check item: {checkName}
Description: {checkDescription}

Review the content of the image and determine whether it complies with this check item.
If multiple images are provided, each image can be referenced with a zero-based index (0th, 1st, etc.).

Also, if objects related to the check item exist in the image, please provide the coordinates of the bounding box for that object.
Coordinates should be specified in the format [x1, y1, x2, y2], with values ranging from 0 to 1000.

Here are examples of responses:

Example 1: For a check item "Multiple documents should have signatures" with 5 images provided
{
  "result": "pass",
  "confidence": 0.92,
  "explanation": "提供された5枚の画像のうち、0番目と2番目の画像に署名が確認できます。0番目の画像には契約書の署名、2番目の画像には同意書の署名があります。",
  "usedImageIndexes": [0, 2],
  "boundingBoxes": [
    {
      "imageIndex": 0,
      "label": "契約書署名",
      "coordinates": [750, 800, 950, 850]
    },
    {
      "imageIndex": 2,
      "label": "同意書署名",
      "coordinates": [500, 700, 700, 750]
    }
  ]
}

Example 2: For a check item "ID card should include photo and expiration date" with 1 image provided
{
  "result": "pass",
  "confidence": 0.95,
  "explanation": "身分証明書には顔写真と有効期限の両方が含まれています。有効期限: 2028年5月31日",
  "usedImageIndexes": [0],
  "boundingBoxes": [
    {
      "imageIndex": 0,
      "label": "顔写真",
      "coordinates": [100, 150, 300, 350]
    },
    {
      "imageIndex": 0,
      "label": "有効期限",
      "coordinates": [400, 500, 600, 530]
    }
  ]
}

It is strictly forbidden to output anything other than JSON. Do not use markdown syntax (like \`\`\`json), return only pure JSON.

{
  "result": "pass" or "fail",
  "confidence": A number between 0 and 1 (confidence level),
  "explanation": "Explanation of the judgment in Japanese",
  "usedImageIndexes": [Indexes of images used for judgment (e.g., [0, 2] means the first and third images were used)],
  "boundingBoxes": [
    {
      "imageIndex": Image index,
      "label": "Label of detected object in Japanese",
      "coordinates": [x1, y1, x2, y2]
    }
  ]
}
`;

/**
 * 画像審査項目処理パラメータ
 */
interface ProcessImageReviewItemParams {
  reviewJobId: string;
  documents: Array<{
    id: string;
    filename: string;
    s3Path: string;
    fileType: string;
  }>;
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
  const { reviewJobId, documents, checkId, reviewResultId } = params;
  const reviewResultRepository = await makePrismaReviewResultRepository();
  const checkRepository = await makePrismaCheckRepository();

  try {
    // チェックリスト項目の取得
    const checkList = await checkRepository.findCheckListItemById(checkId);

    if (!checkList) {
      throw new Error(`Check list item not found: ${checkId}`);
    }

    // S3から画像ファイルを取得
    const s3Client = new S3Client({});
    const bucketName = process.env.DOCUMENT_BUCKET || "";

    // 最大20枚までの画像を取得
    const imageBuffers = await Promise.all(
      documents.slice(0, 20).map(async (doc) => {
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
          documentId: doc.id,
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
          temperature: 0.0,
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
              temperature: 0.0,
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
    const updated = ReviewResultDomain.fromImageLlmReviewData({
      current,
      result: reviewData.result,
      confidenceScore: reviewData.confidence,
      explanation: reviewData.explanation,
      usedImageIndexes: reviewData.usedImageIndexes,
      imageBuffers,
      boundingBoxes: reviewData.boundingBoxes || [],
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
    const reviewJobRepository = await makePrismaReviewJobRepository();
    await reviewJobRepository.updateJobStatus({
      reviewJobId,
      status: REVIEW_JOB_STATUS.FAILED,
    });
    throw error;
  }
}
