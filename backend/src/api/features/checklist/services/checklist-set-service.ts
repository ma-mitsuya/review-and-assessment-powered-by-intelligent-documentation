/**
 * チェックリストセット関連のサービス
 */
import { Document } from '@prisma/client';
import { ChecklistSetRepository, GetChecklistSetsParams as RepoGetChecklistSetsParams } from '../repositories/checklist-set-repository';
import { DocumentRepository } from '../../document/repositories/document-repository';
import { deleteS3Object } from '../../../core/aws';

/**
 * ドキュメント情報
 */
export interface DocumentInfo {
  documentId: string;
  filename: string;
  s3Key: string;
  fileType: string;
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
 * チェックリストセット取得パラメータ
 */
export interface GetChecklistSetsParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * チェックリストセット取得結果
 */
export interface GetChecklistSetsResult {
  checkListSets: Array<{
    check_list_set_id: string;
    name: string;
    description: string | null;
    processing_status: 'pending' | 'in_progress' | 'completed';
  }>;
  total: number;
}

/**
 * チェックリストセットサービス
 */
export class ChecklistSetService {
  private repository: ChecklistSetRepository;
  private documentRepository: DocumentRepository;
  
  constructor() {
    this.repository = new ChecklistSetRepository();
    this.documentRepository = new DocumentRepository();
  }
  
  /**
   * チェックリストセットを作成する
   * @param params 作成パラメータ
   * @returns 作成されたチェックリストセット
   */
  async createChecklistSet(params: CreateChecklistSetParams) {
    return this.repository.createChecklistSet(params);
  }

  /**
   * チェックリストセット一覧を取得する
   * @param params 取得パラメータ
   * @returns チェックリストセット一覧と総数
   */
  async getChecklistSets(params: GetChecklistSetsParams): Promise<GetChecklistSetsResult> {
    const { page, limit, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;
    
    // ソート条件の設定
    const orderBy: Record<string, string> = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      // createdAtフィールドがないため、idでソート
      orderBy['id'] = 'desc';
    }
    
    // リポジトリからデータを取得
    const [checklistSets, total] = await Promise.all([
      this.repository.getChecklistSets({
        skip,
        take: limit,
        orderBy
      }),
      this.repository.getChecklistSetsCount()
    ]);
    
    // 処理状態を計算してレスポンス形式に変換
    const checkListSets = checklistSets.map(set => {
      const processingStatus = this.calculateProcessingStatus(set.documents);
      
      return {
        check_list_set_id: set.id,
        name: set.name,
        description: set.description,
        processing_status: processingStatus
      };
    });
    
    return {
      checkListSets,
      total
    };
  }

  /**
   * チェックリストセットを削除する
   * @param checklistSetId チェックリストセットID
   * @returns 削除が成功したかどうか
   * @throws エラーが発生した場合
   */
  async deleteChecklistSet(checklistSetId: string): Promise<boolean> {
    // 関連するドキュメント情報を取得
    const documents = await this.documentRepository.getDocumentsByChecklistSetId(checklistSetId);

    // DBからチェックリストセットとその関連データを削除
    await this.repository.deleteChecklistSetWithRelations(checklistSetId);

    // S3から関連するすべてのファイルを削除
    const bucketName = process.env.DOCUMENT_BUCKET_NAME || 'beacon-documents';
    for (const document of documents) {
      try {
        await deleteS3Object(bucketName, document.s3Path);
      } catch (s3Error) {
        console.error(`S3 deletion failed for document ${document.id}:`, s3Error);
        // S3削除エラーは致命的ではないので続行
      }
    }

    return true;
  }

  /**
   * ドキュメントの状態からチェックリストセットの処理状態を計算
   * @param documents ドキュメント配列
   * @returns 処理状態
   */
  private calculateProcessingStatus(documents: Document[]): 'pending' | 'in_progress' | 'completed' {
    if (documents.length === 0) {
      return 'pending';
    }
    
    const hasProcessing = documents.some(doc => doc.status === 'processing');
    if (hasProcessing) {
      return 'in_progress';
    }
    
    const allCompleted = documents.every(doc => doc.status === 'completed');
    if (allCompleted) {
      return 'completed';
    }
    
    return 'pending';
  }
}
