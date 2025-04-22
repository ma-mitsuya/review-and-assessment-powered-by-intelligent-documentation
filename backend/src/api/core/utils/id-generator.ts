/**
 * ID生成ユーティリティ
 */
import { ulid } from "ulid";

/**
 * ユニークなIDを生成する
 * @returns 生成されたID（26文字）
 */
export function generateId(): string {
  return ulid();
}
