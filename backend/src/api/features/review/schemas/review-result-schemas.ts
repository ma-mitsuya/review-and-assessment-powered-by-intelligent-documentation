/**
 * 審査結果関連のスキーマ定義
 */
import { FastifySchema } from "fastify";

/**
 * 審査結果項目取得リクエストのスキーマ
 */
export const getReviewResultItemsSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["jobId"],
    properties: {
      jobId: { type: "string" },
    },
  },
  querystring: {
    type: "object",
    properties: {
      parentId: { type: "string" },
      filter: { type: "string", enum: ["all", "passed", "failed"] },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              review_result_id: { type: "string" },
              review_job_id: { type: "string" },  // 追加: 審査ジョブID
              check_id: { type: "string" },
              status: { type: "string" },
              result: { type: ["string", "null"] },
              confidence_score: { type: ["number", "null"] },
              explanation: { type: ["string", "null"] },
              extracted_text: { type: ["string", "null"] },
              user_override: { type: "boolean" },
              user_comment: { type: ["string", "null"] },
              has_children: { type: "boolean" },
              check_list: {
                type: "object",
                properties: {
                  check_id: { type: "string" },
                  name: { type: "string" },
                  description: { type: ["string", "null"] },
                  parent_id: { type: ["string", "null"] },
                  item_type: { type: "string" },
                  is_conclusion: { type: "boolean" },
                  flow_data: { type: ["object", "null"] },
                },
              },
            },
          },
        },
      },
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
      },
    },
    500: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
      },
    },
  },
};

/**
 * 審査結果更新リクエストのスキーマ
 */
export const updateReviewResultSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["jobId", "resultId"],
    properties: {
      jobId: { type: "string" },
      resultId: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["result"],
    properties: {
      result: { type: "string", enum: ["pass", "fail"] },
      userComment: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          properties: {
            review_result_id: { type: "string" },
            review_job_id: { type: "string" },
            check_id: { type: "string" },
            status: { type: "string" },
            result: { type: "string" },
            confidence_score: { type: ["number", "null"] },
            explanation: { type: ["string", "null"] },
            user_override: { type: "boolean" },
            user_comment: { type: ["string", "null"] },
            updated_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
      },
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
      },
    },
    500: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
      },
    },
  },
};
