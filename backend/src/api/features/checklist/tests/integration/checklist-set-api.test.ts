/**
 * チェックリストセットAPI統合テスト
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../../../core/app';
import { FastifyInstance } from 'fastify';
import { getPrismaClient, resetPrismaClient } from '../../../../core/db';
import { generateId } from '../../utils/id-generator';

describe('ChecklistSet API Integration Tests', () => {
  let app: FastifyInstance;
  const prisma = getPrismaClient();
  
  // テスト用アプリケーションのセットアップ
  beforeAll(async () => {
    app = createApp();
    await app.ready();
  });
  
  // テスト終了後のクリーンアップ
  afterAll(async () => {
    await prisma.checkList.deleteMany();
    await prisma.document.deleteMany();
    await prisma.checkListSet.deleteMany();
    await app.close();
    resetPrismaClient();
  });
  
  describe('POST /api/checklist-sets', () => {
    it('チェックリストセットを作成できること', async () => {
      const documentId = generateId();
      
      const payload = {
        name: '統合テスト用チェックリスト',
        description: '統合テスト用の説明',
        documents: [
          {
            documentId,
            filename: 'test.pdf',
            s3Key: `documents/original/${documentId}/test.pdf`,
            fileType: 'application/pdf'
          }
        ]
      };
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/checklist-sets',
        payload
      });
      
      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.check_list_set_id).toBeDefined();
      expect(body.data.name).toBe(payload.name);
      expect(body.data.description).toBe(payload.description);
      expect(body.data.processing_status).toBe('pending');
      
      // データベースに正しく保存されたか確認
      const savedSet = await prisma.checkListSet.findUnique({
        where: { id: body.data.check_list_set_id }
      });
      
      expect(savedSet).toBeDefined();
      expect(savedSet?.name).toBe(payload.name);
      expect(savedSet?.description).toBe(payload.description);
      
      // ドキュメントが正しく作成されたか確認
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });
      
      expect(document).toBeDefined();
      expect(document?.checkListSetId).toBe(body.data.check_list_set_id);
      expect(document?.filename).toBe('test.pdf');
      expect(document?.s3Path).toBe(`documents/original/${documentId}/test.pdf`);
      expect(document?.fileType).toBe('application/pdf');
    });
    
    it('必須フィールドがない場合にエラーを返すこと', async () => {
      const payload = {
        description: '名前がないチェックリスト'
      };
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/checklist-sets',
        payload
      });
      
      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBeFalsy();
    });
  });
});
