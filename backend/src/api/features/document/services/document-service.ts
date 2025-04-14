/**
 * ドキュメント関連のサービス
 */
import { DocumentRepository } from '../repositories/document-repository';

/**
 * ドキュメントサービス
 */
export class DocumentService {
  private repository: DocumentRepository;
  
  constructor() {
    this.repository = new DocumentRepository();
  }
  
  /**
   * ドキュメントが存在するか確認する
   * @param documentId ドキュメントID
   * @returns 存在する場合はtrue、存在しない場合はfalse
   */
  async documentExists(documentId: string): Promise<boolean> {
    return this.repository.documentExists(documentId);
  }
  
  /**
   * ドキュメントを取得する
   * @param documentId ドキュメントID
   * @returns ドキュメント情報
   */
  async getDocument(documentId: string) {
    return this.repository.getDocument(documentId);
  }
}
