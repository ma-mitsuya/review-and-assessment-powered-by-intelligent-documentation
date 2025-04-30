/**
 * 審査結果関連のスキーマ定義
 */
import { FastifySchema } from "fastify";

/**
 * 審査結果階層構造取得リクエストのスキーマ
 */
export const getReviewResultHierarchySchema: FastifySchema = {
  params: {
    type: "object",
    required: ["jobId"],
    properties: {
      jobId: { type: "string" },
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
            $id: "reviewResultItem", //　Add id for recursive reference
            type: "object",
            properties: {
              review_result_id: { type: "string" },
              check_id: { type: "string" },
              status: { type: "string" },
              result: { type: ["string", "null"] },
              confidence_score: { type: ["number", "null"] },
              explanation: { type: ["string", "null"] },
              extracted_text: { type: ["string", "null"] },
              user_override: { type: "boolean" },
              user_comment: { type: ["string", "null"] },
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
              children: {
                type: "array",
                items: {
                  // 同じスキーマを参照して再帰構造を作成
                  // Ref1: https://github.com/fastify/help/issues/659
                  // Ref2: https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/
                  $ref: "reviewResultItem",
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
// export const getReviewResultHierarchySchema: FastifySchema = {
//   params: {
//     type: 'object',
//     required: ['jobId'],
//     properties: {
//       jobId: { type: 'string' }
//     }
//   },
//   response: {
//     200: {
//       type: 'object',
//       properties: {
//         success: { type: 'boolean' },
//         data: {
//           type: 'array',
//           items: {
//             type: 'object',
//             properties: {
//               review_result_id: { type: 'string' },
//               check_id: { type: 'string' },
//               status: { type: 'string' },
//               result: { type: ['string', 'null'] },
//               confidence_score: { type: ['number', 'null'] },
//               explanation: { type: ['string', 'null'] },
//               extracted_text: { type: ['string', 'null'] },
//               user_override: { type: 'boolean' },
//               user_comment: { type: ['string', 'null'] },
//               check_list: {
//                 type: 'object',
//                 properties: {
//                   check_id: { type: 'string' },
//                   name: { type: 'string' },
//                   description: { type: ['string', 'null'] },
//                   parent_id: { type: ['string', 'null'] },
//                   item_type: { type: 'string' },
//                   is_conclusion: { type: 'boolean' },
//                   flow_data: { type: ['object', 'null'] }
//                 }
//               },
//               children: {
//                 type: 'array',
//                 items: {
//                   type: 'object'
//                 }
//               }
//             }
//           }
//         }
//       }
//     },
//     404: {
//       type: 'object',
//       properties: {
//         success: { type: 'boolean' },
//         error: { type: 'string' }
//       }
//     },
//     500: {
//       type: 'object',
//       properties: {
//         success: { type: 'boolean' },
//         error: { type: 'string' }
//       }
//     }
//   }
// };

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
