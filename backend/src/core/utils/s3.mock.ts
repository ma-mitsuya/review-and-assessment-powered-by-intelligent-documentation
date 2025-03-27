// s3.mock.ts
import { vi } from "vitest";
import { S3Utils } from "./s3";
import type { Result } from "./result";

export class MockS3Utils extends S3Utils {
  constructor() {
    super("dummy-bucket");
  }

  override getObject = vi.fn<(key: string) => Promise<Result<Buffer, Error>>>();
  override uploadObject = vi.fn();
  override deleteObject = vi.fn();
  override saveJson = vi.fn();
  override getJson = vi.fn();
}

export function createMockS3Utils(): MockS3Utils {
  return new MockS3Utils();
}
