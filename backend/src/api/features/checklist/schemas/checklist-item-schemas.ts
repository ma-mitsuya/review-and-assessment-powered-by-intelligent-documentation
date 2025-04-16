/**
 * チェックリスト項目関連のスキーマ定義
 */

/**
 * チェックリスト項目詳細取得スキーマ
 */
export const getChecklistItemSchema = {
  params: {
    type: 'object',
    required: ['setId', 'itemId'],
    properties: {
      setId: { type: 'string' },
      itemId: { type: 'string' }
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
            check_id: { type: 'string' },
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
            parent_id: { type: ['string', 'null'] },
            item_type: { type: 'string', enum: ['simple', 'flow'] },
            is_conclusion: { type: 'boolean' },
            flow_data: {
              type: ['object', 'null'],
              properties: {
                condition_type: { type: 'string' },
                next_if_yes: { type: ['string', 'null'] },
                next_if_no: { type: ['string', 'null'] }
              }
            },
            check_list_set_id: { type: 'string' },
            document_id: { type: ['string', 'null'] },
            document: {
              type: ['object', 'null'],
              properties: {
                document_id: { type: 'string' },
                filename: { type: 'string' },
                s3_path: { type: 'string' },
                file_type: { type: 'string' },
                upload_date: { type: 'string', format: 'date-time' },
                status: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};

/**
 * チェックリスト項目階層構造取得スキーマ
 */
export const getChecklistItemHierarchySchema = {
  params: {
    type: 'object',
    required: ['setId'],
    properties: {
      setId: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check_id: { type: 'string' },
              name: { type: 'string' },
              description: { type: ['string', 'null'] },
              parent_id: { type: ['string', 'null'] },
              item_type: { type: 'string', enum: ['simple', 'flow'] },
              is_conclusion: { type: 'boolean' },
              flow_data: {
                type: ['object', 'null'],
                properties: {
                  condition_type: { type: 'string' },
                  next_if_yes: { type: ['string', 'null'] },
                  next_if_no: { type: ['string', 'null'] }
                }
              },
              check_list_set_id: { type: 'string' },
              document_id: { type: ['string', 'null'] },
              children: { type: 'array' }
            }
          }
        }
      }
    }
  }
};

/**
 * チェックリスト項目作成スキーマ
 */
export const createChecklistItemSchema = {
  params: {
    type: 'object',
    required: ['setId'],
    properties: {
      setId: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['name', 'itemType'],
    properties: {
      name: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      parentId: { type: ['string', 'null'] },
      itemType: { type: 'string', enum: ['simple', 'flow'] },
      isConclusion: { type: 'boolean', default: false },
      flowData: {
        type: 'object',
        properties: {
          condition_type: { type: 'string' },
          next_if_yes: { type: 'string' },
          next_if_no: { type: 'string' }
        }
      },
      documentId: { type: ['string', 'null'] }
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
            check_id: { type: 'string' },
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
            parent_id: { type: ['string', 'null'] },
            item_type: { type: 'string', enum: ['simple', 'flow'] },
            is_conclusion: { type: 'boolean' },
            flow_data: { type: ['object', 'null'] },
            check_list_set_id: { type: 'string' },
            document_id: { type: ['string', 'null'] }
          }
        }
      }
    }
  }
};

/**
 * チェックリスト項目更新スキーマ
 */
export const updateChecklistItemSchema = {
  params: {
    type: 'object',
    required: ['setId', 'itemId'],
    properties: {
      setId: { type: 'string' },
      itemId: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      isConclusion: { type: 'boolean' },
      flowData: {
        type: 'object',
        properties: {
          condition_type: { type: 'string' },
          next_if_yes: { type: 'string' },
          next_if_no: { type: 'string' }
        }
      },
      documentId: { type: ['string', 'null'] }
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
            check_id: { type: 'string' },
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
            parent_id: { type: ['string', 'null'] },
            item_type: { type: 'string', enum: ['simple', 'flow'] },
            is_conclusion: { type: 'boolean' },
            flow_data: { type: ['object', 'null'] },
            check_list_set_id: { type: 'string' },
            document_id: { type: ['string', 'null'] }
          }
        }
      }
    }
  }
};

/**
 * チェックリスト項目削除スキーマ
 */
export const deleteChecklistItemSchema = {
  params: {
    type: 'object',
    required: ['setId', 'itemId'],
    properties: {
      setId: { type: 'string' },
      itemId: { type: 'string' }
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
