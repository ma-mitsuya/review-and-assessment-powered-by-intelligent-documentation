/**
 * チェックリストセット関連のリポジトリ
 */
import { getPrismaClient } from '../../../core/db';
import { CreateChecklistSetParams } from '../services/checklist-set-service';
import { generateId } from '../utils/id-generator';

/**
 * チェックリストセットリポジトリ
 */
export class ChecklistSetRepository {
  /**
   * チェックリストセットを作成する
   * @param params 作成パラメータ
   * @returns 作成されたチェックリストセット
   */
  async createChecklistSet(params: CreateChecklistSetParams) {
    const prisma = getPrismaClient();
    const { name, description, documents } = params;
    
    // チェックリストセットIDの生成
    const checkListSetId = generateId();
    
    // トランザクションを使用して、チェックリストセットとドキュメントを一括で処理
    return prisma.$transaction(async (tx) => {
      // チェックリストセットの作成
      const checkListSet = await tx.checkListSet.create({
        data: {
          id: checkListSetId,
          name,
          description
        }
      });
      
      // ドキュメントの作成（documentsが指定されている場合）
      if (documents.length > 0) {
        // 各ドキュメントを作成
        await Promise.all(documents.map(async (doc) => {
          await tx.document.create({
            data: {
              id: doc.documentId,
              filename: doc.filename,
              s3Path: doc.s3Key,
              fileType: doc.fileType,
              uploadDate: new Date(),
              status: 'pending',
              checkListSetId: checkListSetId
            }
          });
        }));
      }
      
      return checkListSet;
    });
  }
}
