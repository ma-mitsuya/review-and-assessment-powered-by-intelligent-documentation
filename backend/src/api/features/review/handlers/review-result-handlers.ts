/**
 * 審査結果関連のハンドラー
 */
import { FastifyReply, FastifyRequest } from "fastify";
import { ReviewResultService } from "../services/review-result-service";
import { ReviewResultItemDto, UpdateReviewResultParams } from "../types";

/**
 * 審査結果項目取得ハンドラー
 */
export async function getReviewResultItemsHandler(
  request: FastifyRequest<{ 
    Params: { jobId: string },
    Querystring: { parentId?: string, filter?: string } 
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { jobId } = request.params;
    const { parentId, filter } = request.query;
    
    console.log(`[Handler] getReviewResultItemsHandler - jobId: ${jobId}, parentId: ${parentId || 'null'}, filter: ${filter || 'all'}`);
    
    const reviewResultService = new ReviewResultService();

    try {
      const items = await reviewResultService.getReviewResultItems(jobId, parentId, filter);
      
      // レスポンス形式に変換
      const formattedData = items.map(item => ({
        review_result_id: item.id,
        check_id: item.checkId,
        status: item.status,
        result: item.result,
        confidence_score: item.confidenceScore,
        explanation: item.explanation,
        extracted_text: item.extractedText,
        user_override: item.userOverride,
        user_comment: item.userComment,
        has_children: item.hasChildren,
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
      }));
      
      console.log(`[Handler] Sending response with ${formattedData.length} items`);
      
      reply.code(200).send({
        success: true,
        data: formattedData,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        console.log(`[Handler] Error: ${error.message}`);
        request.log.error(`Job or parent item not found: ${jobId}, ${parentId}`);
        reply.code(404).send({
          success: false,
          error: parentId 
            ? `審査ジョブまたは親項目が見つかりません` 
            : `審査ジョブが見つかりません: ${jobId}`,
        });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.log(`[Handler] Unexpected error:`, error);
    request.log.error(error);
    reply.code(500).send({
      success: false,
      error: "審査結果項目の取得に失敗しました",
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
