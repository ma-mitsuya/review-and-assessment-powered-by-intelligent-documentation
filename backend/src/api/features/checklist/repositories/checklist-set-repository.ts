/**
 * チェックリストセットリポジトリ
 */
import {
  PrismaClient,
  CheckListDocument,
  CheckListSet,
} from "../../../core/db";
import { prisma } from "../../../core/prisma";
import { DocumentInfo } from "../services/checklist-set-service";
import { ulid } from "ulid";

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
  documents: CheckListDocument[];
}

/**
 * 編集可否情報付きチェックリストセット
 */
export interface ChecklistSetWithEditability extends CheckListSet {
  isEditable: boolean;
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
 * チェックリストセット更新パラメータ
 */
export interface UpdateChecklistSetParams {
  name?: string;
  description?: string;
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
   * チェックリストセットに紐づく審査ジョブの有無を確認する
   * @param setId チェックリストセットID
   * @returns 審査ジョブが存在する場合はtrue、存在しない場合はfalse
   */
  async hasLinkedReviewJobs(setId: string): Promise<boolean> {
    const count = await this.prisma.reviewJob.count({
      where: { checkListSetId: setId }
    });
    console.log(`hasLinkedReviewJobs: setId=${setId}, count=${count}`);
    return count > 0;
  }

  /**
   * 審査ジョブが紐づいているチェックリストセットIDを一括取得
   * @param setIds チェックリストセットIDの配列
   * @returns 審査ジョブが紐づいているチェックリストセットIDの配列
   */
  async getSetIdsWithReviewJobs(setIds: string[]): Promise<string[]> {
    if (setIds.length === 0) {
      console.log('getSetIdsWithReviewJobs: No setIds provided, returning empty array');
      return [];
    }

    console.log('getSetIdsWithReviewJobs: Checking setIds:', setIds);

    const setsWithReviewJobs = await this.prisma.checkListSet.findMany({
      where: {
        id: { in: setIds },
        reviewJobs: { some: {} }
      },
      select: { id: true }
    });

    const result = setsWithReviewJobs.map(set => set.id);
    console.log('getSetIdsWithReviewJobs: Found sets with review jobs:', result);
    
    return result;
  }

  /**
   * チェックリストセット一覧を取得する
   * @param params 取得パラメータ
   * @returns チェックリストセット一覧
   */
  async getChecklistSets(
    params: GetChecklistSetsParams
  ): Promise<ChecklistSetWithDocuments[]> {
    const { skip, take, orderBy } = params;

    return this.prisma.checkListSet.findMany({
      skip,
      take,
      orderBy,
      include: {
        documents: true,
      },
    });
  }

  /**
   * 特定のチェックリストセットを取得する
   * @param id チェックリストセットID
   * @returns チェックリストセット
   */
  async getChecklistSetById(
    id: string
  ): Promise<ChecklistSetWithDocuments | null> {
    return this.prisma.checkListSet.findUnique({
      where: { id },
      include: {
        documents: true,
      },
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
  async createChecklistSet(
    params: CreateChecklistSetParams
  ): Promise<CheckListSet> {
    const { name, description, documents } = params;
    const checkListSetId = ulid();

    return this.prisma.$transaction(async (tx) => {
      // チェックリストセットを作成
      const checkListSet = await tx.checkListSet.create({
        data: {
          id: checkListSetId,
          name,
          description,
          // ドキュメントを関連付け（ステータスをprocessingに設定）
          documents: {
            create: documents.map((doc) => ({
              id: doc.documentId,
              filename: doc.filename,
              s3Path: doc.s3Key,
              fileType: doc.fileType,
              uploadDate: new Date(),
              status: "processing", // 'pending'から変更
            })),
          },
        },
      });

      return checkListSet;
    });
  }

  /**
   * チェックリストセットを更新する
   * @param id チェックリストセットID
   * @param params 更新パラメータ
   * @returns 更新されたチェックリストセット
   */
  async updateChecklistSet(
    id: string,
    params: UpdateChecklistSetParams
  ): Promise<CheckListSet> {
    return this.prisma.checkListSet.update({
      where: { id },
      data: {
        name: params.name,
        description: params.description,
      },
    });
  }

  /**
   * チェックリストセットとその関連データを削除する
   * @param checklistSetId チェックリストセットID
   */
  async deleteChecklistSetWithRelations(checklistSetId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 関連するチェックリスト項目を削除
      await tx.checkList.deleteMany({
        where: { checkListSetId: checklistSetId },
      });

      // 関連するドキュメントを削除
      await tx.checkListDocument.deleteMany({
        where: { checkListSetId: checklistSetId },
      });

      // チェックリストセットを削除
      await tx.checkListSet.delete({
        where: { id: checklistSetId },
      });
    });
  }
}
