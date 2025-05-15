import { ulid } from "ulid";
import {
  CreateChecklistItemRequest,
  CreateChecklistSetRequest,
  UpdateChecklistItemRequest,
} from "../../routes/handlers";

export type CheckListStatus = "pending" | "processing" | "completed";

export interface CheckListSetModel {
  id: string;
  name: string;
  description: string;
  documents: ChecklistDocumentModel[];
}

// 一覧取得用
export interface CheckListSetMetaModel {
  id: string;
  name: string;
  description: string;
  processingStatus: CheckListStatus;
  isEditable: boolean;
}

export interface ChecklistDocumentModel {
  id: string;
  filename: string;
  s3Key: string;
  fileType: string;
  uploadDate: Date;
  status: CheckListStatus;
}

export interface CheckListItemModel {
  id: string;
  parentId?: string;
  setId: string;
  name: string;
  description?: string;
}

export const CheckListSetDomain = {
  fromCreateRequest: (req: CreateChecklistSetRequest): CheckListSetModel => {
    const { name, description, documents } = req;
    return {
      id: ulid(),
      name,
      description: description || "",
      documents: documents.map((doc) => ({
        id: doc.documentId,
        filename: doc.filename,
        s3Key: doc.s3Key,
        fileType: doc.fileType,
        uploadDate: new Date(),
        status: "pending",
      })),
    };
  },
};

export const CheckListItemDomain = {
  fromCreateRequest: (req: CreateChecklistItemRequest): CheckListItemModel => {
    const { Body } = req;
    const { name, description } = Body;

    return {
      id: ulid(),
      setId: req.Params.setId,
      name,
      description: description || "",
    };
  },

  fromUpdateRequest: (req: UpdateChecklistItemRequest): CheckListItemModel => {
    const { Params, Body } = req;
    const { name, description } = Body;

    return {
      id: Params.itemId,
      setId: Params.setId,
      name,
      description: description || "",
    };
  },
};
