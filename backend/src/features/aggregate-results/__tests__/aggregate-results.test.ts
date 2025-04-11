import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aggregatePageResults } from '../aggregate-results';
import { S3Utils } from '../../../core/utils';
import { ChecklistResponse } from '../../result-combining/types';

describe('aggregatePageResults', () => {
  // モックの準備
  const mockS3 = {
    getObject: vi.fn(),
    uploadObject: vi.fn(),
  } as unknown as S3Utils;

  // テスト用のデータ
  const documentId = 'test-document-id';
  const processedPages = [
    { pageNumber: 1 },
    { pageNumber: 2 }
  ];
  
  // テスト用のチェックリストレスポンス
  const mockChecklistResponse1: ChecklistResponse = {
    checklist_items: [
      {
        name: 'テスト項目1',
        description: 'テスト説明1',
        parent_id: null,
        item_type: 'SIMPLE',
        is_conclusion: false,
        flow_data: null
      }
    ],
    meta_data: {
      document_id: documentId,
      page_number: 1
    }
  };
  
  const mockChecklistResponse2: ChecklistResponse = {
    checklist_items: [
      {
        name: 'テスト項目2',
        description: 'テスト説明2',
        parent_id: null,
        item_type: 'SIMPLE',
        is_conclusion: false,
        flow_data: null
      }
    ],
    meta_data: {
      document_id: documentId,
      page_number: 2
    }
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('正常に全ページの結果を集約できること', async () => {
    // S3からのデータ取得のモック
    mockS3.getObject = vi.fn()
      .mockResolvedValueOnce({ ok: true, value: Buffer.from(JSON.stringify(mockChecklistResponse1)) })
      .mockResolvedValueOnce({ ok: true, value: Buffer.from(JSON.stringify(mockChecklistResponse2)) });
    
    // S3へのアップロードのモック
    mockS3.uploadObject = vi.fn().mockResolvedValue({ ok: true });

    // 関数の実行
    const result = await aggregatePageResults(
      { documentId, processedPages },
      { s3: mockS3 }
    );

    // 結果の検証
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.documentId).toBe(documentId);
      expect(result.value.aggregatedData[documentId]).toHaveLength(2);
      expect(result.value.aggregatedData[documentId][0]).toEqual(mockChecklistResponse1);
      expect(result.value.aggregatedData[documentId][1]).toEqual(mockChecklistResponse2);
    }

    // S3の関数が正しく呼ばれたことを確認
    expect(mockS3.getObject).toHaveBeenCalledTimes(2);
    expect(mockS3.uploadObject).toHaveBeenCalledTimes(1);
  });

  it('S3からのデータ取得に失敗した場合はエラーを返すこと', async () => {
    // S3からのデータ取得のモック（エラー）
    mockS3.getObject = vi.fn().mockResolvedValue({ 
      ok: false, 
      error: new Error('S3からの読み込みに失敗しました') 
    });

    // 関数の実行
    const result = await aggregatePageResults(
      { documentId, processedPages },
      { s3: mockS3 }
    );

    // 結果の検証
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('S3からの読み込み');
    }

    // S3のgetObjectが呼ばれたことを確認（processedPagesの数だけ呼ばれる）
    expect(mockS3.getObject).toHaveBeenCalledTimes(processedPages.length);
    // uploadObjectは呼ばれないはず
    expect(mockS3.uploadObject).not.toHaveBeenCalled();
  });

  it('S3へのアップロードに失敗した場合はエラーを返すこと', async () => {
    // S3からのデータ取得のモック（成功）
    mockS3.getObject = vi.fn()
      .mockResolvedValueOnce({ ok: true, value: Buffer.from(JSON.stringify(mockChecklistResponse1)) })
      .mockResolvedValueOnce({ ok: true, value: Buffer.from(JSON.stringify(mockChecklistResponse2)) });
    
    // S3へのアップロードのモック（失敗）
    mockS3.uploadObject = vi.fn().mockResolvedValue({ 
      ok: false, 
      error: new Error('S3への書き込みに失敗しました') 
    });

    // 関数の実行
    const result = await aggregatePageResults(
      { documentId, processedPages },
      { s3: mockS3 }
    );

    // 結果の検証
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('S3への書き込み');
    }

    // S3の関数が正しく呼ばれたことを確認
    expect(mockS3.getObject).toHaveBeenCalledTimes(2);
    expect(mockS3.uploadObject).toHaveBeenCalledTimes(1);
  });
});
