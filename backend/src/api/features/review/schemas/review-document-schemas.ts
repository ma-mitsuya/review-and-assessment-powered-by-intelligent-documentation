/**
 * 審査ドキュメント関連のスキーマ定義
 */
import { FastifySchema } from 'fastify';

/**
 * Presigned URL取得リクエストのスキーマ
 */
export const getReviewPresignedUrlSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['filename', 'contentType'],
    properties: {
      filename: { type: 'string' },
      contentType: { type: 'string' }
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
            url: { type: 'string' },
            key: { type: 'string' },
            documentId: { type: 'string' }
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
 * 審査ドキュメント削除リクエストのスキーマ
 */
export const deleteReviewDocumentSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            deleted: { type: 'boolean' },
          },
        },
      },
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' },
      },
    },
  },
};
