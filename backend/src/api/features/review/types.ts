/**
 * 審査機能の型定義
 */

/**
 * 審査ドキュメントDTO
 */
export interface ReviewDocumentDto {
  id: string;
  filename: string;
  s3Path: string;
  fileType: string;
  uploadDate: Date;
  userId: string | null;
  status: string;
}

/**
 * 審査ジョブDTO
 */
export interface ReviewJobDto {
  id: string;
  name: string;
  status: string;
  documentId: string;
  checkListSetId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  userId: string | null;
  document?: ReviewDocumentDto;
  checkListSet?: {
    id: string;
    name: string;
    description?: string | null;
  };
}

/**
 * 審査結果DTO
 */
export interface ReviewResultDto {
  id: string;
  reviewJobId: string;
  checkId: string;
  status: string;
  result: string | null;
  confidenceScore: number | null;
  explanation: string | null;
  extractedText: string | null;
  userOverride: boolean;
  userComment: string | null;
  createdAt: Date;
  updatedAt: Date;
  checkList?: {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    itemType: string;
    isConclusion: boolean;
    flowData?: any;
  };
}

/**
 * 審査結果階層構造
 */
export interface ReviewResultHierarchyDto extends ReviewResultDto {
  children: ReviewResultHierarchyDto[];
}

/**
 * 審査ジョブ一覧取得パラメータ
 */
export interface GetReviewJobsParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
}

/**
 * 審査ジョブ作成パラメータ
 */
export interface CreateReviewJobParams {
  name: string;
  documentId: string;
  checkListSetId: string;
  userId?: string;
}

/**
 * 審査結果更新パラメータ
 */
export interface UpdateReviewResultParams {
  result: string;
  userComment?: string;
}

/**
 * 審査ジョブサマリー
 */
export interface ReviewJobSummary {
  total: number;
  passed: number;
  failed: number;
  processing?: number;
}
