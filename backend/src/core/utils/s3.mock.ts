// s3.mock.ts
import { vi } from "vitest";
import { S3Utils } from "./s3";
import type { Result } from "./result";

// モック用のインターフェースを定義
export interface IMockS3Utils {
  getObject: ReturnType<typeof vi.fn<[string], Promise<Result<Buffer, Error>>>>;
  uploadObject: ReturnType<typeof vi.fn<[string, string | Buffer | Uint8Array, string?], Promise<Result<void, Error>>>>;
  deleteObject: ReturnType<typeof vi.fn<[string], Promise<Result<void, Error>>>>;
  saveJson: ReturnType<typeof vi.fn<[string, any], Promise<Result<void, Error>>>>;
  getJson: ReturnType<typeof vi.fn<[string], Promise<Result<any, Error>>>>;
}

// S3Utilsを拡張したモッククラス
export class MockS3Utils extends S3Utils implements IMockS3Utils {
  constructor() {
    super("dummy-bucket");
  }

  // vi.fn() の型定義を修正して、正しい関数シグネチャと一致させる
  getObject = vi.fn<[string], Promise<Result<Buffer, Error>>>();
  uploadObject = vi.fn<[string, string | Buffer | Uint8Array, string?], Promise<Result<void, Error>>>();
  deleteObject = vi.fn<[string], Promise<Result<void, Error>>>();
  saveJson = vi.fn<[string, any], Promise<Result<void, Error>>>();
  getJson = vi.fn<[string], Promise<Result<any, Error>>>();
}

export function createMockS3Utils(): MockS3Utils {
  return new MockS3Utils();
}
