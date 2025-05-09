import { ulid } from "ulid";

export type CheckListStatus = "pending" | "processing" | "completed";
export type ItemType = "simple" | "flow";

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
  name: string;
  description: string;
  itemType: ItemType;
  isConclusion: boolean;
}

export const CheckListDomain = {
  fromUploadedDocuments: (params: {
    name: string;
    description?: string;
    documents: Omit<ChecklistDocumentModel, "uploadDate" | "status">[];
  }): CheckListSetModel => {
    const { name, description, documents } = params;
    return {
      id: ulid(),
      name,
      description: description || "",
      documents: documents.map((doc) => ({
        ...doc,
        uploadDate: new Date(),
        status: "processing",
      })),
    };
  },
};
