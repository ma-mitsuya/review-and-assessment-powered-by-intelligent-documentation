/**
 * ID生成ユーティリティ
 */
import { customAlphabet } from 'nanoid';

// 26文字のIDを生成するためのアルファベット
// 数字、小文字、大文字を使用
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 26);

/**
 * ユニークなIDを生成する
 * @returns 生成されたID（26文字）
 */
export function generateId(): string {
  return nanoid();
}
