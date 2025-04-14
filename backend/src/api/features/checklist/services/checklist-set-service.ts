/**
 * チェックリストセット関連のサービス
 */
import { ChecklistSetRepository } from '../repositories/checklist-set-repository';

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
 * チェックリストセットサービス
 */
export class ChecklistSetService {
  private repository: ChecklistSetRepository;
  
  constructor() {
    this.repository = new ChecklistSetRepository();
  }
  
  /**
   * チェックリストセットを作成する
   * @param params 作成パラメータ
   * @returns 作成されたチェックリストセット
   */
  async createChecklistSet(params: CreateChecklistSetParams) {
    return this.repository.createChecklistSet(params);
  }
}
