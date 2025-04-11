/**
 * Presigned URL生成ユーティリティのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PresignedUrlGenerator } from '../presigned-url';

// S3クライアントのモック
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    // モックメソッドは不要（getSignedUrlでモックするため）
  })),
  PutObjectCommand: vi.fn().mockImplementation((params) => params),
  GetObjectCommand: vi.fn().mockImplementation((params) => params)
}));

// getSignedUrlのモック
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://example.com/presigned-url')
}));

describe('PresignedUrlGenerator', () => {
  let generator: PresignedUrlGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new PresignedUrlGenerator('test-bucket', 'us-west-2');
  });

  describe('generateUploadUrl', () => {
    it('アップロード用のPresigned URLを生成できること', async () => {
      // テスト実行
      const result = await generator.generateUploadUrl(
        'test/key.pdf',
        'application/pdf',
        3600
      );

      // 検証
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('https://example.com/presigned-url');
      }
    });

    it('エラー時にエラー結果を返すこと', async () => {
      // getSignedUrlがエラーを投げるようにモック
      const getSignedUrl = require('@aws-sdk/s3-request-presigner').getSignedUrl;
      getSignedUrl.mockRejectedValueOnce(new Error('Test error'));

      // テスト実行
      const result = await generator.generateUploadUrl(
        'test/key.pdf',
        'application/pdf'
      );

      // 検証
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Test error');
      }
    });
  });

  describe('generateDownloadUrl', () => {
    it('ダウンロード用のPresigned URLを生成できること', async () => {
      // テスト実行
      const result = await generator.generateDownloadUrl(
        'test/key.pdf',
        3600
      );

      // 検証
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('https://example.com/presigned-url');
      }
    });

    it('エラー時にエラー結果を返すこと', async () => {
      // getSignedUrlがエラーを投げるようにモック
      const getSignedUrl = require('@aws-sdk/s3-request-presigner').getSignedUrl;
      getSignedUrl.mockRejectedValueOnce(new Error('Test error'));

      // テスト実行
      const result = await generator.generateDownloadUrl('test/key.pdf');

      // 検証
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Test error');
      }
    });
  });
});
