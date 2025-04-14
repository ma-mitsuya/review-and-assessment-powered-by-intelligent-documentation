/**
 * データベース接続管理
 */
import { PrismaClient } from '@prisma/client';

// PrismaClientのシングルトンインスタンス
let prismaClient: PrismaClient | null = null;

/**
 * PrismaClientを取得する
 * @returns PrismaClientインスタンス
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    });
  }
  return prismaClient;
}

/**
 * PrismaClientをリセットする（主にテスト用）
 */
export async function resetPrismaClient(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
}
