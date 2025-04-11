/**
 * ドキュメントサービスのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentServiceImpl } from '../document-service';
import { DocumentRepository } from '../document-repository';
import { Document, DocumentStatus } from '../types';

// モックリポジトリの作成
const createMockRepository = (): DocumentRepository => ({
  createDocument: vi.fn(),
  getDocumentById: vi.fn(),
  updateDocumentStatus: vi.fn(),
  getDocumentsByCheckListSetId: vi.fn(),
});

describe('DocumentServiceImpl', () => {
  let repository: DocumentRepository;
  let service: DocumentServiceImpl;
  
  beforeEach(() => {
    repository = createMockRepository();
    service = new DocumentServiceImpl(repository, 'test-bucket', 'us-west-2', 'test-state-machine-arn');
    
    // モックの設定
    vi.mock('@aws-sdk/client-sfn', () => ({
      SFNClient: vi.fn().mockImplementation(() => ({
        send: vi.fn().mockResolvedValue({}),
      })),
      StartExecutionCommand: vi.fn(),
    }));
    
    vi.mock('../../../core/utils/presigned-url', () => ({
      createPresignedUrlGenerator: vi.fn().mockReturnValue({
        generateUploadUrl: vi.fn().mockResolvedValue({
          ok: true,
          value: 'https://example.com/presigned-url',
        }),
      }),
    }));
  });
  
  it('should get document status', async () => {
    // モックの設定
    const mockDocument: Document = {
      document_id: 'test-id',
      filename: 'test.pdf',
      s3_path: 'path/to/test.pdf',
      file_type: 'pdf',
      upload_date: '2023-01-01T00:00:00Z',
      status: 'pending',
    };
    
    vi.mocked(repository.getDocumentById).mockResolvedValue(mockDocument);
    
    // テスト実行
    const result = await service.getDocumentStatus('test-id');
    
    // 検証
    expect(repository.getDocumentById).toHaveBeenCalledWith('test-id');
    expect(result).toEqual(mockDocument);
  });
  
  it('should update document status', async () => {
    // モックの設定
    const mockDocument: Document = {
      document_id: 'test-id',
      filename: 'test.pdf',
      s3_path: 'path/to/test.pdf',
      file_type: 'pdf',
      upload_date: '2023-01-01T00:00:00Z',
      status: 'processing',
    };
    
    vi.mocked(repository.updateDocumentStatus).mockResolvedValue(mockDocument);
    
    // テスト実行
    const result = await service.updateDocumentStatus('test-id', 'processing');
    
    // 検証
    expect(repository.updateDocumentStatus).toHaveBeenCalledWith('test-id', 'processing');
    expect(result).toEqual(mockDocument);
  });
  
  // 他のテストケースも追加可能
});
