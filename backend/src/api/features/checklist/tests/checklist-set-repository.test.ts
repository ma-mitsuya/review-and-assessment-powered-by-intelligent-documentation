/**
 * チェックリストセットリポジトリのテスト
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChecklistSetRepository } from '../repositories/checklist-set-repository';
import { getPrismaClient, resetPrismaClient } from '../../../core/db';
import { generateId } from '../utils/id-generator';

describe('ChecklistSetRepository', () => {
  const repository = new ChecklistSetRepository();
  const prisma = getPrismaClient();
  
  // 各テスト後にデータをクリーンアップ
  afterEach(async () => {
    await prisma.checkList.deleteMany();
    await prisma.document.deleteMany();
    await prisma.checkListSet.deleteMany();
  });
  
  // テスト終了後にPrismaクライアントを切断
  afterEach(() => {
    resetPrismaClient();
  });
  
  describe('createChecklistSet', () => {
    it('ドキュメントなしでチェックリストセットを作成できること', async () => {
      const params = {
        name: 'テストチェックリスト',
        description: 'テスト用の説明',
        documents: []
      };
      
      const result = await repository.createChecklistSet(params);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(params.name);
      expect(result.description).toBe(params.description);
      
      // データベースに正しく保存されたか確認
      const savedSet = await prisma.checkListSet.findUnique({
        where: { id: result.id }
      });
      
      expect(savedSet).toBeDefined();
      expect(savedSet?.name).toBe(params.name);
      expect(savedSet?.description).toBe(params.description);
    });
    
    it('ドキュメント情報を指定してチェックリストセットを作成できること', async () => {
      const documentId = generateId();
      
      const params = {
        name: 'テストチェックリスト',
        description: 'テスト用の説明',
        documents: [
          {
            documentId,
            filename: 'test.pdf',
            s3Key: `documents/original/${documentId}/test.pdf`,
            fileType: 'application/pdf'
          }
        ]
      };
      
      const result = await repository.createChecklistSet(params);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      
      // ドキュメントが正しく作成されたか確認
      const documents = await prisma.document.findMany({
        where: { checkListSetId: result.id }
      });
      
      expect(documents).toHaveLength(1);
      expect(documents[0].id).toBe(documentId);
      expect(documents[0].filename).toBe('test.pdf');
      expect(documents[0].s3Path).toBe(`documents/original/${documentId}/test.pdf`);
      expect(documents[0].fileType).toBe('application/pdf');
    });
    
    it('複数のドキュメントを指定してチェックリストセットを作成できること', async () => {
      const documentId1 = generateId();
      const documentId2 = generateId();
      
      const params = {
        name: 'テストチェックリスト',
        description: 'テスト用の説明',
        documents: [
          {
            documentId: documentId1,
            filename: 'test1.pdf',
            s3Key: `documents/original/${documentId1}/test1.pdf`,
            fileType: 'application/pdf'
          },
          {
            documentId: documentId2,
            filename: 'test2.png',
            s3Key: `documents/original/${documentId2}/test2.png`,
            fileType: 'image/png'
          }
        ]
      };
      
      const result = await repository.createChecklistSet(params);
      
      // ドキュメントが正しく作成されたか確認
      const documents = await prisma.document.findMany({
        where: { checkListSetId: result.id }
      });
      
      expect(documents).toHaveLength(2);
      
      // ドキュメントIDでソートして確認
      const sortedDocuments = documents.sort((a, b) => a.id.localeCompare(b.id));
      
      expect(sortedDocuments[0].id).toBe(documentId1);
      expect(sortedDocuments[0].filename).toBe('test1.pdf');
      expect(sortedDocuments[0].fileType).toBe('application/pdf');
      
      expect(sortedDocuments[1].id).toBe(documentId2);
      expect(sortedDocuments[1].filename).toBe('test2.png');
      expect(sortedDocuments[1].fileType).toBe('image/png');
    });
  });
});
