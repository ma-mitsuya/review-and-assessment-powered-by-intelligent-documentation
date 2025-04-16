/**
 * 審査ジョブ関連のスキーマ定義
 */
import { FastifySchema } from 'fastify';

/**
 * 審査ジョブ一覧取得リクエストのスキーマ
 */
export const getReviewJobsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number', default: 1 },
      limit: { type: 'number', default: 10 },
      sortBy: { type: 'string' },
      sortOrder: { type: 'string', enum: ['asc', 'desc'] },
      status: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            reviewJobs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  review_job_id: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                  document: {
                    type: 'object',
                    properties: {
                      document_id: { type: 'string' },
                      filename: { type: 'string' }
                    }
                  },
                  check_list_set: {
                    type: 'object',
                    properties: {
                      check_list_set_id: { type: 'string' },
                      name: { type: 'string' }
                    }
                  },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                  completed_at: { type: ['string', 'null'], format: 'date-time' },
                  summary: {
                    type: 'object',
                    properties: {
                      total: { type: 'number' },
                      passed: { type: 'number' },
                      failed: { type: 'number' },
                      processing: { type: 'number' }
                    }
                  }
                }
              }
            },
            total: { type: 'number' }
          }
        }
      }
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
};

/**
 * 審査ジョブ作成リクエストのスキーマ
 */
export const createReviewJobSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['name', 'documentId', 'checkListSetId'],
    properties: {
      name: { type: 'string' },
      documentId: { type: 'string' },
      checkListSetId: { type: 'string' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            review_job_id: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string' },
            document: {
              type: 'object',
              properties: {
                document_id: { type: 'string' },
                filename: { type: 'string' }
              }
            },
            check_list_set: {
              type: 'object',
              properties: {
                check_list_set_id: { type: 'string' },
                name: { type: 'string' }
              }
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            completed_at: { type: ['string', 'null'], format: 'date-time' }
          }
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
};

/**
 * 審査ジョブ削除リクエストのスキーマ
 */
export const deleteReviewJobSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            deleted: { type: 'boolean' }
          }
        }
      }
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
};
