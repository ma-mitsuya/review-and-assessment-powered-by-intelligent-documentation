/**
 * チェックリストセットリポジトリ
 */
import { PrismaClient, Document, CheckListSet } from '@prisma/client';
import { prisma } from '../../../core/prisma';
import { DocumentInfo } from '../services/checklist-set-service';
import { ulid } from 'ulid';

/**
 * チェックリストセット取得パラメータ
 */
export interface GetChecklistSetsParams {
  skip: number;
  take: number;
  orderBy: Record<string, string>;
}

/**
 * ドキュメント付きチェックリストセット
 */
export interface ChecklistSetWithDocuments extends CheckListSet {
  documents: Document[];
}

/**
 * チェックリストセット作成パラメータ
 */
export interface CreateChecklistSetParams {
  name: string;
  description?: string;
  documents: DocumentInfo[];
}

/**
 * チェックリストセットリポジトリクラス
 */
export class ChecklistSetRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * チェックリストセット一覧を取得する
   * @param params 取得パラメータ
   * @returns チェックリストセット一覧
   */
  async getChecklistSets(params: GetChecklistSetsParams): Promise<ChecklistSetWithDocuments[]> {
    const { skip, take, orderBy } = params;

    return this.prisma.checkListSet.findMany({
      skip,
      take,
      orderBy,
      include: {
        documents: true
      }
    });
  }

  /**
   * チェックリストセットの総数を取得する
   * @returns チェックリストセットの総数
   */
  async getChecklistSetsCount(): Promise<number> {
    return this.prisma.checkListSet.count();
  }

  /**
   * チェックリストセットを作成する
   * @param params 作成パラメータ
   * @returns 作成されたチェックリストセット
   */
  async createChecklistSet(params: CreateChecklistSetParams): Promise<CheckListSet> {
    const { name, description, documents } = params;
    const checkListSetId = ulid();
    
    return this.prisma.$transaction(async (tx) => {
      // チェックリストセットを作成
      const checkListSet = await tx.checkListSet.create({
        data: {
          id: checkListSetId,
          name,
          description,
          // ドキュメントを関連付け
          documents: {
            create: documents.map(doc => ({
              id: doc.documentId,
              filename: doc.filename,
              s3Path: doc.s3Key,
              fileType: doc.fileType,
              uploadDate: new Date(),
              status: 'pending'
            }))
          }
        }
      });
      
      return checkListSet;
    });
  }
}
