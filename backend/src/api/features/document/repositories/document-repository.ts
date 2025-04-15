/**
 * ドキュメント関連のリポジトリ
 */
import { getPrismaClient } from '../../../core/db';

/**
 * ドキュメントリポジトリ
 */
export class DocumentRepository {
  /**
   * ドキュメントが存在するか確認する
   * @param documentId ドキュメントID
   * @returns 存在する場合はtrue、存在しない場合はfalse
   */
  async documentExists(documentId: string): Promise<boolean> {
    const prisma = getPrismaClient();
    const document = await prisma.checkListDocument.findUnique({
      where: { id: documentId }
    });
    return !!document;
  }
  
  /**
   * ドキュメントを取得する
   * @param documentId ドキュメントID
   * @returns ドキュメント情報
   */
  async getDocument(documentId: string) {
    const prisma = getPrismaClient();
    return prisma.checkListDocument.findUnique({
      where: { id: documentId }
    });
  }
  
  /**
   * ドキュメントを作成する
   * @param params ドキュメント作成パラメータ
   * @returns 作成されたドキュメント
   */
  async createDocument(params: {
    id: string;
    filename: string;
    s3Path: string;
    fileType: string;
    checkListSetId: string;
    userId?: string;
  }) {
    const prisma = getPrismaClient();
    return prisma.checkListDocument.create({
      data: {
        id: params.id,
        filename: params.filename,
        s3Path: params.s3Path,
        fileType: params.fileType,
        uploadDate: new Date(),
        status: 'pending',
        checkListSetId: params.checkListSetId,
        userId: params.userId
      }
    });
  }

  /**
   * ドキュメントを削除する
   * @param documentId ドキュメントID
   * @returns 削除成功時はtrue
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    const prisma = getPrismaClient();
    await prisma.checkListDocument.delete({
      where: { id: documentId }
    });
    return true;
  }

  /**
   * チェックリストセットに関連するドキュメント一覧を取得する
   * @param checkListSetId チェックリストセットID
   * @returns ドキュメント一覧
   */
  async getDocumentsByChecklistSetId(checkListSetId: string) {
    const prisma = getPrismaClient();
    return prisma.checkListDocument.findMany({
      where: { checkListSetId }
    });
  }
}
