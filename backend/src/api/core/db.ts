/**
 * データベース接続管理
 */
import { PrismaClient } from '@prisma/client';

// シングルトンインスタンス
let prismaInstance: PrismaClient | null = null;

/**
 * Prismaクライアントのシングルトンインスタンスを取得
 * @returns PrismaClientインスタンス
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prismaInstance;
}

/**
 * テスト用にPrismaクライアントをリセット
 */
export function resetPrismaClient(): void {
  if (prismaInstance) {
    prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
