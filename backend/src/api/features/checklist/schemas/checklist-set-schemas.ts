/**
 * チェックリストセット関連のスキーマ定義
 */
import { FastifySchema } from 'fastify';

/**
 * ドキュメント情報のスキーマ
 */
const documentInfoSchema = {
  type: 'object',
  required: ['documentId', 'filename', 's3Key', 'fileType'],
  properties: {
    documentId: { type: 'string' },
    filename: { type: 'string' },
    s3Key: { type: 'string' },
    fileType: { type: 'string' }
  }
};

/**
 * チェックリストセット作成リクエストのスキーマ
 */
export const createChecklistSetSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 255 },
      description: { type: 'string', nullable: true },
      documents: { 
        type: 'array', 
        items: documentInfoSchema,
        default: []
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
            description: { type: 'string', nullable: true },
            processing_status: { type: 'string' }
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
