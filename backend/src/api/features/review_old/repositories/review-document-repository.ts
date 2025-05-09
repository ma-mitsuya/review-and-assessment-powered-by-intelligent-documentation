/**
 * 審査ドキュメントリポジトリ
 */
import { PrismaClient } from "../../../core/db";
import { getPrismaClient } from "../../../core/db";
import { ReviewDocumentDto } from "../types";

/**
 * 審査ドキュメントリポジトリ
 */
export class ReviewDocumentRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = getPrismaClient()) {
    this.prisma = prismaClient;
  }

  /**
   * 審査ドキュメントが存在するか確認する
   * @param documentId 審査ドキュメントID
   * @returns 存在する場合はtrue、存在しない場合はfalse
   */
  async documentExists(documentId: string): Promise<boolean> {
    const document = await this.prisma.reviewDocument.findUnique({
      where: { id: documentId },
    });
    return !!document;
  }

  /**
   * 審査ドキュメントを取得する
   * @param documentId 審査ドキュメントID
   * @returns 審査ドキュメント情報
   */
  async getDocument(documentId: string): Promise<ReviewDocumentDto | null> {
    return this.prisma.reviewDocument.findUnique({
      where: { id: documentId },
    });
  }

  /**
   * 審査ドキュメントを作成する
   * @param params 審査ドキュメント作成パラメータ
   * @returns 作成された審査ドキュメント
   */
  async createDocument(params: {
    id: string;
    filename: string;
    s3Path: string;
    fileType: string;
    userId?: string;
  }): Promise<ReviewDocumentDto> {
    return this.prisma.reviewDocument.create({
      data: {
        id: params.id,
        filename: params.filename,
        s3Path: params.s3Path,
        fileType: params.fileType,
        uploadDate: new Date(),
        status: "pending",
        userId: params.userId,
      },
    });
  }

  /**
   * 審査ドキュメントを削除する
   * @param documentId 審査ドキュメントID
   * @returns 削除成功時はtrue
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    await this.prisma.reviewDocument.delete({
      where: { id: documentId },
    });
    return true;
  }

  /**
   * 審査ドキュメント一覧を取得する
   * @param skip スキップ数
   * @param take 取得数
   * @returns 審査ドキュメント一覧
   */
  async getDocuments(skip: number, take: number): Promise<ReviewDocumentDto[]> {
    return this.prisma.reviewDocument.findMany({
      skip,
      take,
      orderBy: { uploadDate: "desc" },
    });
  }

  /**
   * 審査ドキュメントの総数を取得する
   * @returns 審査ドキュメントの総数
   */
  async getDocumentsCount(): Promise<number> {
    return this.prisma.reviewDocument.count();
  }

  /**
   * 審査ドキュメントのステータスを更新する
   * @param documentId 審査ドキュメントID
   * @param status 新しいステータス
   * @returns 更新された審査ドキュメント
   */
  async updateDocumentStatus(
    documentId: string,
    status: string
  ): Promise<ReviewDocumentDto> {
    return this.prisma.reviewDocument.update({
      where: { id: documentId },
      data: { status },
    });
  }
}
