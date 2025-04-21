/**
 * チェックリスト項目リポジトリ
 */
import { PrismaClient, CheckList } from '@prisma/client';
import { prisma } from '../../../core/prisma';
import { ulid } from 'ulid';
import { FlowData } from '../types/checklist-item-types';

/**
 * チェックリスト項目作成パラメータ
 */
export interface CreateChecklistItemParams {
  id: string; // 修正: 外部からIDを指定する必須パラメータに変更
  name: string;
  description?: string;
  parentId?: string | null;
  itemType: 'simple' | 'flow';
  isConclusion: boolean;
  flowData?: FlowData;
  checkListSetId: string;
  documentId?: string | null;
}

/**
 * チェックリスト項目更新パラメータ
 */
export interface UpdateChecklistItemParams {
  name?: string;
  description?: string;
  isConclusion?: boolean;
  flowData?: FlowData;
  documentId?: string | null;
}

/**
 * チェックリスト項目リポジトリクラス
 */
export class ChecklistItemRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * チェックリスト項目を取得する
   * @param checkId チェックリスト項目ID
   * @returns チェックリスト項目
   */
  async getChecklistItem(checkId: string): Promise<CheckList | null> {
    return this.prisma.checkList.findUnique({
      where: { id: checkId },
      include: {
        document: true
      }
    });
  }

  /**
   * チェックリストセットに属する項目を階層構造で取得する
   * @param checkListSetId チェックリストセットID
   * @returns チェックリスト項目の配列
   */
  async getChecklistItemHierarchy(checkListSetId: string): Promise<CheckList[]> {
    return this.prisma.checkList.findMany({
      where: { checkListSetId },
      include: {
        document: true
      }
    });
  }

  /**
   * チェックリスト項目を作成する
   * @param params 作成パラメータ
   * @returns 作成されたチェックリスト項目
   */
  async createChecklistItem(params: CreateChecklistItemParams): Promise<CheckList> {
    return this.prisma.checkList.create({
      data: {
        id: params.id,
        name: params.name,
        description: params.description,
        parentId: params.parentId,
        itemType: params.itemType,
        isConclusion: params.isConclusion,
        flowData: params.flowData as any,
        checkListSetId: params.checkListSetId,
        documentId: params.documentId
      },
      include: {
        document: true
      }
    });
  }

  /**
   * チェックリスト項目を更新する
   * @param checkId チェックリスト項目ID
   * @param params 更新パラメータ
   * @returns 更新されたチェックリスト項目
   */
  async updateChecklistItem(checkId: string, params: UpdateChecklistItemParams): Promise<CheckList> {
    return this.prisma.checkList.update({
      where: { id: checkId },
      data: {
        name: params.name,
        description: params.description,
        isConclusion: params.isConclusion,
        flowData: params.flowData as any,
        documentId: params.documentId
      },
      include: {
        document: true
      }
    });
  }

  /**
   * チェックリスト項目を削除する
   * @param checkId チェックリスト項目ID
   * @returns 削除が成功したかどうか
   */
  async deleteChecklistItem(checkId: string): Promise<boolean> {
    // 子項目を再帰的に削除するため、まず子項目を取得
    const children = await this.prisma.checkList.findMany({
      where: { parentId: checkId }
    });

    // トランザクションで削除処理を実行
    await this.prisma.$transaction(async (tx) => {
      // 子項目を再帰的に削除
      for (const child of children) {
        // 再帰的に子項目を削除（実際の実装では再帰呼び出しではなくトランザクション内で処理）
        await tx.checkList.deleteMany({
          where: { parentId: child.id }
        });
        await tx.checkList.delete({
          where: { id: child.id }
        });
      }

      // 関連するチェック結果を削除
      await tx.checkResult.deleteMany({
        where: { checkId }
      });

      // 関連する抽出項目を削除
      await tx.extractedItem.deleteMany({
        where: { checkId }
      });

      // 関連するレビュー結果を削除
      await tx.reviewResult.deleteMany({
        where: { checkId }
      });

      // 最後に対象のチェックリスト項目を削除
      await tx.checkList.delete({
        where: { id: checkId }
      });
    });

    return true;
  }

  /**
   * チェックリスト項目が特定のチェックリストセットに属しているか確認する
   * @param checkId チェックリスト項目ID
   * @param checkListSetId チェックリストセットID
   * @returns 属している場合はtrue、そうでない場合はfalse
   */
  async checkItemBelongsToSet(checkId: string, checkListSetId: string): Promise<boolean> {
    const item = await this.prisma.checkList.findFirst({
      where: {
        id: checkId,
        checkListSetId
      }
    });
    return !!item;
  }

  /**
   * 親項目のドキュメントIDを取得する
   * @param parentId 親項目ID
   * @returns ドキュメントID
   */
  async getParentDocumentId(parentId: string): Promise<string | null> {
    const parent = await this.prisma.checkList.findUnique({
      where: { id: parentId },
      select: { documentId: true }
    });
    return parent?.documentId || null;
  }
}
