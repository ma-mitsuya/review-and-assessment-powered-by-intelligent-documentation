import { ulid } from "ulid";
import { CreateReviewJobRequest } from "../../routes/handlers";
import {
  CheckListItemEntity,
  CheckListSetEntity,
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

/**
 * 審査ファイルタイプ
 */
export enum REVIEW_FILE_TYPE {
  PDF = "pdf",
  IMAGE = "image",
}

export interface ReviewJobStats {
  total: number;
  passed: number;
  failed: number;
  processing: number;
}

export interface ReviewJobEntity {
  id: string;
  name: string;
  status: REVIEW_JOB_STATUS;
  checkListSetId: string;
  userId?: string;
  documents: Array<{
    id: string;
    filename: string;
    s3Key: string;
    fileType: REVIEW_FILE_TYPE;
  }>;
  results: ReviewResultEntity[];
}

/**
 * ジョブ一覧表示用
 */
export interface ReviewJobSummary {
  id: string;
  name: string;
  status: REVIEW_JOB_STATUS;
  checkListSetId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  userId?: string;
  documents: Array<{
    id: string;
    filename: string;
    s3Path: string;
    fileType: REVIEW_FILE_TYPE;
  }>;
  checkListSet: {
    id: string;
    name: string;
  };
  stats: ReviewJobStats;
}

/**
 * ジョブ結果画面のジョブ情報表示用
 */
export interface ReviewJobDetail {
  id: string;
  name: string;
  status: REVIEW_JOB_STATUS;
  checkList: CheckListSetEntity;
  documents: Array<{
    id: string;
    filename: string;
    s3Path: string;
    fileType: REVIEW_FILE_TYPE;
  }>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * 参照元情報
 */
export interface SourceReference {
  documentId: string;
  pageNumber?: number;
  boundingBox?: {
    label: string;
    coordinates: [number, number, number, number]; // [x1, y1, x2, y2]
  };
}

export interface ReviewResultEntity {
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
  sourceReferences?: SourceReference[];
}

export interface ReviewResultDetail extends ReviewResultEntity {
  checkList: CheckListItemEntity;
  hasChildren: boolean;
}

export const ReviewResultDomain = (() => {
  const _buildSourceReferencesFromImages = (
    usedImageIndexes: number[] | undefined,
    imageBuffers: Array<{
      documentId: string;
      filename: string;
      buffer: Uint8Array;
    }>
  ): SourceReference[] => {
    // usedImageIndexesが指定されている場合は、その画像のみを使用
    if (usedImageIndexes && usedImageIndexes.length > 0) {
      return usedImageIndexes
        .filter((index) => index >= 0 && index < imageBuffers.length)
        .map((index) => ({
          documentId: imageBuffers[index].documentId,
        }));
    }

    // そうでない場合は全ての画像を使用
    return imageBuffers.map((img) => ({
      documentId: img.documentId,
    }));
  };

  return {
    fromOverrideRequest: (params: {
      current: ReviewResultDetail;
      result: REVIEW_RESULT;
      userComment: string;
    }): ReviewResultDetail => {
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
      current: ReviewResultDetail;
      result: REVIEW_RESULT;
      confidenceScore: number;
      explanation: string;
      extractedText: string;
      sourceReferences: SourceReference[];
    }): ReviewResultEntity => {
      const {
        result,
        confidenceScore,
        explanation,
        extractedText,
        sourceReferences,
      } = params;

      return {
        ...params.current,
        status: REVIEW_RESULT_STATUS.COMPLETED,
        result,
        confidenceScore,
        explanation,
        extractedText,
        sourceReferences,
        userOverride: false,
        updatedAt: new Date(),
      };
    },

    fromImageLlmReviewData: (params: {
      current: ReviewResultDetail;
      result: REVIEW_RESULT;
      confidenceScore: number;
      explanation: string;
      usedImageIndexes: number[];
      imageBuffers: Array<{
        documentId: string;
        filename: string;
        buffer: Uint8Array;
      }>;
      boundingBoxes?: Array<{
        imageIndex: number;
        label: string;
        coordinates: [number, number, number, number];
      }>;
    }): ReviewResultEntity => {
      const {
        result,
        confidenceScore,
        explanation,
        usedImageIndexes,
        imageBuffers,
        boundingBoxes = [],
      } = params;

      // 基本的な参照元情報を構築
      const sourceReferences = _buildSourceReferencesFromImages(
        usedImageIndexes,
        imageBuffers
      );

      // バウンディングボックス情報を追加
      if (boundingBoxes && boundingBoxes.length > 0) {
        boundingBoxes.forEach((box) => {
          const imageIndex = box.imageIndex;
          if (imageIndex >= 0 && imageIndex < imageBuffers.length) {
            const documentId = imageBuffers[imageIndex].documentId;
            // 既存の参照元情報を探す
            const existingRef = sourceReferences.find(
              (ref) => ref.documentId === documentId
            );
            if (existingRef) {
              // 既存の参照元情報にバウンディングボックスを追加
              existingRef.boundingBox = {
                label: box.label,
                coordinates: box.coordinates,
              };
            } else {
              // 新しい参照元情報を追加
              sourceReferences.push({
                documentId,
                boundingBox: {
                  label: box.label,
                  coordinates: box.coordinates,
                },
              });
            }
          }
        });
      }

      return {
        ...params.current,
        status: REVIEW_RESULT_STATUS.COMPLETED,
        result,
        confidenceScore,
        explanation,
        sourceReferences,
        userOverride: false,
        updatedAt: new Date(),
      };
    },

    parseSourceReferences: (
      documentId: string,
      pageNumberOrIndices?: string | number
    ): SourceReference[] => {
      if (pageNumberOrIndices === undefined) {
        return [{ documentId }];
      }

      // 文字列の場合（カンマ区切りの可能性あり）
      if (typeof pageNumberOrIndices === "string") {
        // カンマ区切りの場合は複数の参照元を作成
        if (pageNumberOrIndices.includes(",")) {
          return pageNumberOrIndices.split(",").map((index) => ({
            documentId,
            pageNumber: parseInt(index.trim(), 10),
          }));
        }
        // 単一の値の場合
        return [
          {
            documentId,
            pageNumber: parseInt(pageNumberOrIndices, 10),
          },
        ];
      }

      // 数値の場合
      return [
        {
          documentId,
          pageNumber: pageNumberOrIndices,
        },
      ];
    },
  };
})();
