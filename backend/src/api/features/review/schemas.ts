import { FastifySchema } from "fastify";

/**
 * Presigned URL取得リクエストのスキーマ
 */
export const getReviewPresignedUrlSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["filename", "contentType"],
    properties: {
      filename: { type: "string" },
      contentType: { type: "string" },
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
            url: { type: "string" },
            key: { type: "string" },
            documentId: { type: "string" },
          },
        },
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
 * 審査ドキュメント削除リクエストのスキーマ
 */
export const deleteReviewDocumentSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["key"],
    properties: {
      key: { type: "string" },
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
            deleted: { type: "boolean" },
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
 * 審査ジョブ一覧取得リクエストのスキーマ
 */
export const getReviewJobsSchema: FastifySchema = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "number", default: 1 },
      limit: { type: "number", default: 10 },
      sortBy: { type: "string" },
      sortOrder: { type: "string", enum: ["asc", "desc"] },
      status: { type: "string" },
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
            reviewJobs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  review_job_id: { type: "string" },
                  name: { type: "string" },
                  status: { type: "string" },
                  document: {
                    type: "object",
                    properties: {
                      document_id: { type: "string" },
                      filename: { type: "string" },
                    },
                  },
                  check_list_set: {
                    type: "object",
                    properties: {
                      check_list_set_id: { type: "string" },
                      name: { type: "string" },
                    },
                  },
                  created_at: { type: "string", format: "date-time" },
                  updated_at: { type: "string", format: "date-time" },
                  completed_at: {
                    type: ["string", "null"],
                    format: "date-time",
                  },
                  summary: {
                    type: "object",
                    properties: {
                      total: { type: "number" },
                      passed: { type: "number" },
                      failed: { type: "number" },
                      processing: { type: "number" },
                    },
                  },
                },
              },
            },
            total: { type: "number" },
          },
        },
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
 * 審査ジョブ作成リクエストのスキーマ
 */
export const createReviewJobSchema: FastifySchema = {
  body: {
    type: "object",
    required: [
      "name",
      "documentId",
      "checkListSetId",
      "fileType",
      "filename",
      "s3Key",
    ],
    properties: {
      name: { type: "string" },
      documentId: { type: "string" },
      checkListSetId: { type: "string" },
      fileType: { type: "string" },
      filename: { type: "string" },
      s3Key: { type: "string" },
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          properties: {
            review_job_id: { type: "string" },
            name: { type: "string" },
            status: { type: "string" },
            document: {
              type: "object",
              properties: {
                document_id: { type: "string" },
                filename: { type: "string" },
              },
            },
            check_list_set: {
              type: "object",
              properties: {
                check_list_set_id: { type: "string" },
                name: { type: "string" },
              },
            },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
            completed_at: { type: ["string", "null"], format: "date-time" },
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
 * 審査ジョブ削除リクエストのスキーマ
 */
export const deleteReviewJobSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
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
            deleted: { type: "boolean" },
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
              review_job_id: { type: "string" }, // 追加: 審査ジョブID
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
