/**
 * Prismaクライアントのエクスポート
 */
import { PrismaClient } from "../../../prisma/client";
import { getPrismaClient } from './db';

// アプリケーション全体で使用するPrismaClientのインスタンス
let prisma: PrismaClient;

// 初期化関数
export async function initializePrisma(): Promise<void> {
  prisma = await getPrismaClient();
}

// prismaクライアントのエクスポート
export { prisma };
