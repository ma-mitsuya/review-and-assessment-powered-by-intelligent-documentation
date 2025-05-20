/**
 * Review feature type definitions
 * These types correspond to the backend API endpoints in backend/src/api/features/review/routes
 */

import { ApiResponse } from '../../types/api';

// Enum types
/**
 * Review job status enum
 */
export enum REVIEW_JOB_STATUS {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

/**
 * Review result status enum
 */
export enum REVIEW_RESULT_STATUS {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

/**
 * Review result enum
 */
export enum REVIEW_RESULT {
  PASS = "pass",
  FAIL = "fail",
}

// Request types

/**
 * Request type for getting a presigned URL for review document upload
 * POST /documents/review/presigned-url
 */
export interface GetReviewPresignedUrlRequest {
  filename: string;
  contentType: string;
}

/**
 * Request type for creating a review job
 * POST /review-jobs
 */
export interface CreateReviewJobRequest {
  name: string;
  documentId: string;
  checkListSetId: string;
  filename: string;
  s3Key: string;
  fileType: string;
  userId?: string;
}

/**
 * Request type for overriding a review result
 * PUT /review-jobs/:jobId/results/:resultId
 */
export interface OverrideReviewResultRequest {
  result: REVIEW_RESULT;
  userComment: string;
}

// Response types

/**
 * Response type for getting all review jobs
 * GET /review-jobs
 */
export type GetAllReviewJobsResponse = ApiResponse<ReviewJobMetaModel[]>;

/**
 * Response type for getting a review job detail
 * GET /review-jobs/:jobId
 */
export type GetReviewJobDetailResponse = ApiResponse<ReviewJobDetailModel>;

/**
 * Response type for getting a presigned URL for review document upload
 * POST /documents/review/presigned-url
 */
export type GetReviewPresignedUrlResponse = ApiResponse<{
  url: string;
  key: string;
  documentId: string;
}>;

/**
 * Response type for deleting a review document
 * DELETE /documents/review/:key
 */
export type DeleteReviewDocumentResponse = ApiResponse<{
  deleted: boolean;
}>;

/**
 * Response type for creating a review job
 * POST /review-jobs
 */
export type CreateReviewJobResponse = ApiResponse<Record<string, never>>;

/**
 * Response type for deleting a review job
 * DELETE /review-jobs/:id
 */
export type DeleteReviewJobResponse = ApiResponse<Record<string, never>>;

/**
 * Response type for getting review result items
 * GET /review-jobs/:jobId/results/items
 */
export type GetReviewResultItemsResponse = ApiResponse<ReviewResultDetailModel[]>;

/**
 * Response type for overriding a review result
 * PUT /review-jobs/:jobId/results/:resultId
 */
export type OverrideReviewResultResponse = ApiResponse<Record<string, never>>;

// Model types

/**
 * Review job summary model
 */
export interface ReviewJobSummary {
  total: number;
  passed: number;
  failed: number;
  processing: number;
}

/**
 * Review job model
 */
export interface ReviewJobModel {
  id: string;
  name: string;
  status: REVIEW_JOB_STATUS;
  documentId: string;
  checkListSetId: string;
  userId?: string;
  filename: string;
  s3Key: string;
  fileType: string;
  results: ReviewResultModel[];
}

/**
 * Review job meta model (for list view)
 */
export interface ReviewJobMetaModel {
  id: string;
  name: string;
  status: REVIEW_JOB_STATUS;
  documentId: string;
  checkListSetId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  userId?: string;
  document: {
    id: string;
    filename: string;
    s3Path: string;
    fileType: string;
  };
  checkListSet: {
    id: string;
    name: string;
  };
  summary: ReviewJobSummary;
}

/**
 * Review job detail model (for detail view)
 */
export interface ReviewJobDetailModel {
  id: string;
  name: string;
  status: REVIEW_JOB_STATUS;
  checkList: {
    id: string;
    name: string;
    description?: string;
    documents: {
      id: string;
      filename: string;
      s3Key: string;
      fileType: string;
      uploadDate: Date;
      status: string;
    }[];
  };
  documentId: string;
  document: {
    id: string;
    filename: string;
    s3Path: string;
    fileType: string;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Review result model
 */
export interface ReviewResultModel {
  id: string;
  reviewJobId: string;
  checkId: string;
  status: REVIEW_RESULT_STATUS;
  result?: REVIEW_RESULT;
  confidenceScore?: number;
  explanation?: string;
  extractedText?: string;
  userComment?: string;
  userOverride: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Review result detail model (includes checklist item)
 */
export interface ReviewResultDetailModel extends ReviewResultModel {
  checkList: CheckListItemModel;
  hasChildren: boolean;
}

/**
 * Checklist item model (imported from checklist feature)
 */
export interface CheckListItemModel {
  id: string;
  parentId?: string;
  setId: string;
  name: string;
  description?: string;
}
