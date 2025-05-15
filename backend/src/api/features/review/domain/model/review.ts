import { ulid } from "ulid";
import { CreateReviewJobRequest } from "../../routes/handlers";

export interface ReviewJobSummary {
  total: number;
  passed: number;
  failed: number;
  processing: number;
}

export interface ReviewJobModel {
  id: string;
  name: string;
  documentId: string;
  checkListSetId: string;
  userId: string | null;
  filename: string;
  s3Key: string;
  fileType: string;
}

export interface ReviewJobMetaModel {
  id: string;
  name: string;
  status: string;
  documentId: string;
  checkListSetId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  userId: string | null;
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

export const ReviewJobDomain = {
  fromCreateRequest: (req: CreateReviewJobRequest): ReviewJobModel => {
    const { name, documentId, checkListSetId, filename, s3Key, fileType } = req;
    return {
      id: ulid(),
      name,
      documentId,
      checkListSetId,
      userId: null,
      filename,
      s3Key,
      fileType,
    };
  },
};
