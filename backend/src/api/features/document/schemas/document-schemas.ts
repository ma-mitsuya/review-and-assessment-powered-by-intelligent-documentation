/**
 * ドキュメント関連のスキーマ定義
 */
import { FastifySchema } from 'fastify';

/**
 * Presigned URL取得リクエストのスキーマ
 */
export const getPresignedUrlSchema: FastifySchema = {
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
 * ドキュメント削除リクエストのスキーマ
 */
export const deleteDocumentSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['key'],
    properties: {
      key: { type: 'string' },
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
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' },
      },
    },
  },
};
