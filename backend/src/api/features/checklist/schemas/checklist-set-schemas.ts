/**
 * チェックリストセット関連のスキーマ定義
 */

/**
 * チェックリストセット作成スキーマ
 */
export const createChecklistSetSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      documents: {
        type: 'array',
        items: {
          type: 'object',
          required: ['documentId', 'filename', 's3Key', 'fileType'],
          properties: {
            documentId: { type: 'string' },
            filename: { type: 'string' },
            s3Key: { type: 'string' },
            fileType: { type: 'string' }
          }
        }
      }
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
            check_list_set_id: { type: 'string' },
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
            processing_status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] }
          }
        }
      }
    }
  }
};

/**
 * チェックリストセット一覧取得スキーマ
 */
export const getChecklistSetsSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      sortBy: { type: 'string' },
      sortOrder: { type: 'string', enum: ['asc', 'desc'] }
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
            checkListSets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  check_list_set_id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  processing_status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] }
                }
              }
            },
            total: { type: 'integer' }
          }
        }
      }
    }
  }
};

/**
 * チェックリストセット削除スキーマ
 */
export const deleteChecklistSetSchema = {
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
    }
  }
};
