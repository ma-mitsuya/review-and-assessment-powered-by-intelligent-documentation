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
    const document = await prisma.document.findUnique({
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
    return prisma.document.findUnique({
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
    return prisma.document.create({
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
}
