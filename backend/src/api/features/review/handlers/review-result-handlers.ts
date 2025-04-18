/**
 * 審査結果関連のハンドラー
 */
import { FastifyReply, FastifyRequest } from "fastify";
import { ReviewResultService } from "../services/review-result-service";
import { ReviewResultHierarchyDto, UpdateReviewResultParams } from "../types";

export async function getReviewResultHierarchyHandler(
  request: FastifyRequest<{ Params: { jobId: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { jobId } = request.params;
    request.log.info(`Fetching review result hierarchy for job: ${jobId}`);

    const reviewResultService = new ReviewResultService();

    try {
      const hierarchy = await reviewResultService.getReviewResultHierarchy(
        jobId
      );
      console.log(
        `Handler received hierarchy with ${hierarchy.length} root items`
      );

      // 最初の項目の子要素数を確認
      if (hierarchy.length > 0) {
        console.log(
          `First root has ${hierarchy[0].children.length} children in handler`
        );
      }

      // レスポンス用に適切に変換する深い再帰関数
      const formatResponseItem = (item: ReviewResultHierarchyDto): any => {
        const children = Array.isArray(item.children) ? item.children : [];
        console.log(
          `Formatting item ${item.checkId} with ${children.length} children`
        );

        const formattedChildren = children.map((child) => {
          console.log(
            `Processing child ${child.checkId} of parent ${item.checkId}`
          );
          return formatResponseItem(child);
        });

        return {
          review_result_id: item.id,
          check_id: item.checkId,
          status: item.status,
          result: item.result,
          confidence_score: item.confidenceScore,
          explanation: item.explanation,
          extracted_text: item.extractedText,
          user_override: item.userOverride,
          user_comment: item.userComment,
          check_list: item.checkList
            ? {
                check_id: item.checkList.id,
                name: item.checkList.name,
                description: item.checkList.description,
                parent_id: item.checkList.parentId,
                item_type: item.checkList.itemType,
                is_conclusion: item.checkList.isConclusion,
                flow_data: item.checkList.flowData,
              }
            : null,
          children: formattedChildren,
        };
      };

      const formattedData = hierarchy.map((item) => formatResponseItem(item));
      console.log(`Formatted response with ${formattedData.length} root items`);

      // 最終レスポンスをチェック
      if (formattedData.length > 0) {
        const firstItem = formattedData[0];
        console.log(
          `First formatted item has ${firstItem.children.length} children`
        );
        console.log(
          `First item children:`,
          JSON.stringify(firstItem.children).substring(0, 100)
        );
      }

      request.log.info(
        `Successfully retrieved hierarchy with ${formattedData.length} root items`
      );

      /**
       * Fastifyのレスポンス処理において、オブジェクトをそのまま送信すると
       * 複雑なネストされた階層構造が正しく変換されないケースがある。
       * 特に `reply.send({success: true, data: formattedData})` のようなラッパー形式で
       * 送信する場合、内部データがシリアライズ処理で欠落する可能性がある。
       *
       * この問題を回避するため、明示的にJSONに変換した後、再度パースして送信することで
       * すべてのネストされた階層構造を保持したレスポンスを保証する。
       * これによりフロントエンドが期待する完全なデータ構造を維持できる。
       */
      const responseObject = {
        success: true,
        data: formattedData,
      };
      const jsonResponse = JSON.stringify(responseObject);
      reply
        .code(200)
        .header("Content-Type", "application/json")
        .send(jsonResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        request.log.error(`Job not found: ${jobId}`);
        reply.code(404).send({
          success: false,
          error: `審査ジョブが見つかりません: ${jobId}`,
        });
        return;
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({
      success: false,
      error: "審査結果の取得に失敗しました",
    });
  }
}
/**
 * 審査結果更新ハンドラー
 */
export async function updateReviewResultHandler(
  request: FastifyRequest<{
    Params: { jobId: string; resultId: string };
    Body: UpdateReviewResultParams;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { jobId, resultId } = request.params;
    const { result, userComment } = request.body;

    const reviewResultService = new ReviewResultService();

    try {
      const updatedResult = await reviewResultService.overrideReviewResult(
        jobId,
        resultId,
        {
          result,
          userComment,
        }
      );

      // 親項目の結果を再計算
      await reviewResultService.recalculateParentResults(
        jobId,
        updatedResult.checkId
      );

      // レスポンス形式に変換
      const responseData = {
        review_result_id: updatedResult.id,
        review_job_id: updatedResult.reviewJobId,
        check_id: updatedResult.checkId,
        status: updatedResult.status,
        result: updatedResult.result,
        confidence_score: updatedResult.confidenceScore,
        explanation: updatedResult.explanation,
        user_override: updatedResult.userOverride,
        user_comment: updatedResult.userComment,
        updated_at: updatedResult.updatedAt,
      };

      reply.code(200).send({
        success: true,
        data: responseData,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          reply.code(404).send({
            success: false,
            error: error.message,
          });
          return;
        }
        if (error.message.includes("does not belong to")) {
          reply.code(400).send({
            success: false,
            error: error.message,
          });
          return;
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({
      success: false,
      error: "審査結果の更新に失敗しました",
    });
  }
}
