/**
 * 審査結果リポジトリのテスト
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReviewResultRepository } from '../repositories/review-result-repository';
import { getPrismaClient } from '../../../core/db';
import { generateId } from '../../checklist/utils/id-generator';

// テスト用のデータ
const testCheckListSetId = generateId();
const testDocumentId = generateId();
const testJobId = generateId();
const testCheckId = generateId();
const testResultId = generateId();

describe('ReviewResultRepository', () => {
  const prisma = getPrismaClient();
  const repository = new ReviewResultRepository(prisma);
  
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
    
    await prisma.checkList.create({
      data: {
        id: testCheckId,
        name: 'テスト用チェック項目',
        itemType: 'simple',
        isConclusion: false,
        checkListSetId: testCheckListSetId
      }
    });
    
    await prisma.reviewJob.create({
      data: {
        id: testJobId,
        name: 'テスト用審査ジョブ',
        status: 'pending',
        documentId: testDocumentId,
        checkListSetId: testCheckListSetId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  });
  
  // テスト後のクリーンアップ
  afterEach(async () => {
    // テスト用のデータを削除
    await prisma.reviewResult.deleteMany({
      where: {
        OR: [
          { id: testResultId },
          { reviewJobId: testJobId }
        ]
      }
    });
    
    await prisma.reviewJob.deleteMany({
      where: { id: testJobId }
    });
    
    await prisma.checkList.deleteMany({
      where: { id: testCheckId }
    });
    
    await prisma.reviewDocument.deleteMany({
      where: { id: testDocumentId }
    });
    
    await prisma.checkListSet.deleteMany({
      where: { id: testCheckListSetId }
    });
  });
  
  it('審査結果を作成できること', async () => {
    const result = await repository.createReviewResult({
      id: testResultId,
      reviewJobId: testJobId,
      checkId: testCheckId
    });
    
    expect(result).toBeDefined();
    expect(result.id).toBe(testResultId);
    expect(result.reviewJobId).toBe(testJobId);
    expect(result.checkId).toBe(testCheckId);
    expect(result.status).toBe('pending');
    expect(result.userOverride).toBe(false);
  });
  
  it('審査結果を取得できること', async () => {
    // 審査結果を作成
    await repository.createReviewResult({
      id: testResultId,
      reviewJobId: testJobId,
      checkId: testCheckId
    });
    
    // 審査結果を取得
    const result = await repository.getReviewResult(testResultId);
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(testResultId);
    expect(result?.reviewJobId).toBe(testJobId);
    expect(result?.checkId).toBe(testCheckId);
  });
  
  it('審査ジョブに関連する審査結果一覧を取得できること', async () => {
    // 審査結果を作成
    await repository.createReviewResult({
      id: testResultId,
      reviewJobId: testJobId,
      checkId: testCheckId
    });
    
    // 審査結果一覧を取得
    const results = await repository.getReviewResultsByJobId(testJobId);
    
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    
    const result = results.find(r => r.id === testResultId);
    expect(result).toBeDefined();
    expect(result?.reviewJobId).toBe(testJobId);
    expect(result?.checkId).toBe(testCheckId);
  });
  
  it('審査結果を更新できること', async () => {
    // 審査結果を作成
    await repository.createReviewResult({
      id: testResultId,
      reviewJobId: testJobId,
      checkId: testCheckId
    });
    
    // 審査結果を更新
    const updatedResult = await repository.updateReviewResult(testResultId, {
      status: 'completed',
      result: 'pass',
      confidenceScore: 0.95,
      explanation: 'テスト用の説明',
      extractedText: 'テスト用の抽出テキスト'
    });
    
    expect(updatedResult).toBeDefined();
    expect(updatedResult.id).toBe(testResultId);
    expect(updatedResult.status).toBe('completed');
    expect(updatedResult.result).toBe('pass');
    expect(updatedResult.confidenceScore).toBe(0.95);
    expect(updatedResult.explanation).toBe('テスト用の説明');
    expect(updatedResult.extractedText).toBe('テスト用の抽出テキスト');
  });
  
  it('ユーザーによる審査結果の上書きができること', async () => {
    // 審査結果を作成
    await repository.createReviewResult({
      id: testResultId,
      reviewJobId: testJobId,
      checkId: testCheckId
    });
    
    // 審査結果を更新
    await repository.updateReviewResult(testResultId, {
      status: 'completed',
      result: 'fail',
      confidenceScore: 0.8
    });
    
    // ユーザーによる上書き
    const overriddenResult = await repository.overrideReviewResult(testResultId, {
      result: 'pass',
      userComment: 'ユーザーによる上書き'
    });
    
    expect(overriddenResult).toBeDefined();
    expect(overriddenResult.id).toBe(testResultId);
    expect(overriddenResult.result).toBe('pass');
    expect(overriddenResult.userOverride).toBe(true);
    expect(overriddenResult.userComment).toBe('ユーザーによる上書き');
  });
  
  it('審査結果の集計を取得できること', async () => {
    // 審査結果を作成
    await repository.createReviewResult({
      id: testResultId,
      reviewJobId: testJobId,
      checkId: testCheckId
    });
    
    // 審査結果を更新
    await repository.updateReviewResult(testResultId, {
      status: 'completed',
      result: 'pass'
    });
    
    // 別の審査結果を作成
    const anotherResultId = generateId();
    await repository.createReviewResult({
      id: anotherResultId,
      reviewJobId: testJobId,
      checkId: testCheckId
    });
    
    // 別の審査結果を更新
    await repository.updateReviewResult(anotherResultId, {
      status: 'completed',
      result: 'fail'
    });
    
    // 集計を取得
    const summary = await repository.getReviewResultsSummary(testJobId);
    
    expect(summary).toBeDefined();
    expect(summary.total).toBe(2);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.processing).toBe(0);
  });
});
