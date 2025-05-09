/**
 * 審査ジョブリポジトリのテスト
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReviewJobRepository } from '../repositories/review-job-repository';
import { getPrismaClient } from '../../../core/db';
import { generateId } from '../../checklist/utils/id-generator';

// テスト用のデータ
const testCheckListSetId = generateId();
const testDocumentId = generateId();
const testJobId = generateId();

describe('ReviewJobRepository', () => {
  const prisma = getPrismaClient();
  const repository = new ReviewJobRepository(prisma);
  
  // テスト前の準備
  beforeEach(async () => {
    // テスト用のデータを作成
    await prisma.checkListSet.create({
      data: {
        id: testCheckListSetId,
        name: 'テスト用チェックリストセット'
      }
    });
    
    await prisma.reviewDocument.create({
      data: {
        id: testDocumentId,
        filename: 'test.pdf',
        s3Path: `documents/review/${testDocumentId}/test.pdf`,
        fileType: 'application/pdf',
        uploadDate: new Date(),
        status: 'pending'
      }
    });
  });
  
  // テスト後のクリーンアップ
  afterEach(async () => {
    // テスト用のデータを削除
    await prisma.reviewJob.deleteMany({
      where: {
        OR: [
          { id: testJobId },
          { name: { contains: 'テスト' } }
        ]
      }
    });
    
    await prisma.reviewDocument.deleteMany({
      where: { id: testDocumentId }
    });
    
    await prisma.checkListSet.deleteMany({
      where: { id: testCheckListSetId }
    });
  });
  
  it('審査ジョブを作成できること', async () => {
    const job = await repository.createReviewJob({
      id: testJobId,
      name: 'テスト用審査ジョブ',
      documentId: testDocumentId,
      checkListSetId: testCheckListSetId
    });
    
    expect(job).toBeDefined();
    expect(job.id).toBe(testJobId);
    expect(job.name).toBe('テスト用審査ジョブ');
    expect(job.status).toBe('pending');
    expect(job.documentId).toBe(testDocumentId);
    expect(job.checkListSetId).toBe(testCheckListSetId);
  });
  
  it('審査ジョブを取得できること', async () => {
    // 審査ジョブを作成
    await repository.createReviewJob({
      id: testJobId,
      name: 'テスト用審査ジョブ',
      documentId: testDocumentId,
      checkListSetId: testCheckListSetId
    });
    
    // 審査ジョブを取得
    const job = await repository.getReviewJob(testJobId);
    
    expect(job).toBeDefined();
    expect(job?.id).toBe(testJobId);
    expect(job?.name).toBe('テスト用審査ジョブ');
    expect(job?.status).toBe('pending');
  });
  
  it('審査ジョブ一覧を取得できること', async () => {
    // 審査ジョブを作成
    await repository.createReviewJob({
      id: testJobId,
      name: 'テスト用審査ジョブ',
      documentId: testDocumentId,
      checkListSetId: testCheckListSetId
    });
    
    // 審査ジョブ一覧を取得
    const jobs = await repository.getReviewJobs({
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    expect(jobs).toBeDefined();
    expect(jobs.length).toBeGreaterThan(0);
    
    const job = jobs.find(j => j.id === testJobId);
    expect(job).toBeDefined();
    expect(job?.name).toBe('テスト用審査ジョブ');
  });
  
  it('審査ジョブのステータスを更新できること', async () => {
    // 審査ジョブを作成
    await repository.createReviewJob({
      id: testJobId,
      name: 'テスト用審査ジョブ',
      documentId: testDocumentId,
      checkListSetId: testCheckListSetId
    });
    
    // ステータスを更新
    const updatedJob = await repository.updateReviewJobStatus(testJobId, 'processing');
    
    expect(updatedJob).toBeDefined();
    expect(updatedJob.id).toBe(testJobId);
    expect(updatedJob.status).toBe('processing');
    
    // 完了ステータスに更新
    const completedJob = await repository.updateReviewJobStatus(testJobId, 'completed');
    
    expect(completedJob).toBeDefined();
    expect(completedJob.status).toBe('completed');
    expect(completedJob.completedAt).toBeDefined();
  });
  
  it('審査ジョブを削除できること', async () => {
    // 審査ジョブを作成
    await repository.createReviewJob({
      id: testJobId,
      name: 'テスト用審査ジョブ',
      documentId: testDocumentId,
      checkListSetId: testCheckListSetId
    });
    
    // 審査ジョブを削除
    const result = await repository.deleteReviewJob(testJobId);
    
    expect(result).toBe(true);
    
    // 削除されたことを確認
    const job = await repository.getReviewJob(testJobId);
    expect(job).toBeNull();
  });
});
