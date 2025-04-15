/**
 * Prismaクライアントのエクスポート
 */
import { getPrismaClient } from './db';

// アプリケーション全体で使用するPrismaClientのインスタンス
export const prisma = getPrismaClient();
