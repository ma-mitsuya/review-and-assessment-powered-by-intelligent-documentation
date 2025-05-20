import { ulid } from "ulid";
import { CreateReviewJobRequest } from "../../routes/handlers";
import {
  CheckListItemModel,
  CheckListSetModel,
} from "../../../checklist/domain/model/checklist";

/**
 * 審査ジョブのステータス
 */
export enum REVIEW_JOB_STATUS {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

/**
 * 審査結果のステータス
 */
export enum REVIEW_RESULT_STATUS {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

/**
 * 審査結果の評価
 */
export enum REVIEW_RESULT {
  PASS = "pass",
  FAIL = "fail",
}

export interface ReviewJobSummary {
  total: number;
  passed: number;
  failed: number;
  processing: number;
}

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
 * ジョブ一覧表示用
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
 * ジョブ結果画面のジョブ情報表示用
 */
export interface ReviewJobDetailModel {
  id: string;
  name: string;
  status: REVIEW_JOB_STATUS;
  checkList: CheckListSetModel;
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

export interface ReviewResultDetailModel extends ReviewResultModel {
  checkList: CheckListItemModel;
  hasChildren: boolean;
}

export const ReviewResultDomain = (() => {
  return {
    fromOverrideRequest: (params: {
      current: ReviewResultDetailModel;
      result: REVIEW_RESULT;
      userComment: string;
    }): ReviewResultDetailModel => {
      const { current, result, userComment } = params;
      return {
        ...current,
        result,
        userComment,
        userOverride: true,
        updatedAt: new Date(),
      };
    },

    fromLlmReviewData: (params: {
      current: ReviewResultDetailModel;
      result: REVIEW_RESULT;
      confidenceScore: number;
      explanation: string;
      extractedText: string;
    }): ReviewResultModel => {
      const { result, confidenceScore, explanation, extractedText } = params;
      return {
        ...params.current,
        status: REVIEW_RESULT_STATUS.COMPLETED,
        result,
        confidenceScore,
        explanation,
        extractedText,
        userOverride: false,
        updatedAt: new Date(),
      };
    },
  };
})();
