/**
 * Checklist feature type definitions
 * These types correspond to the backend API endpoints in backend/src/api/features/checklist/routes
 */

// Common types
export interface Document {
  documentId: string;
  filename: string;
  s3Key: string;
  fileType: string;
}

export type CheckListStatus = "pending" | "processing" | "completed";

// Request types

/**
 * Request type for creating a checklist set
 * POST /checklist-sets
 */
export interface CreateChecklistSetRequest {
  name: string;
  description?: string;
  documents: Document[];
}

/**
 * Request type for getting a presigned URL for checklist document upload
 * POST /documents/checklist/presigned-url
 */
export interface GetChecklistPresignedUrlRequest {
  filename: string;
  contentType: string;
}

/**
 * Request type for creating a checklist item
 * POST /checklist-sets/:setId/items
 */
export interface CreateChecklistItemRequest {
  name: string;
  description?: string;
  parentId?: string;
}

/**
 * Request type for updating a checklist item
 * PUT /checklist-sets/:setId/items/:itemId
 */
export interface UpdateChecklistItemRequest {
  name: string;
  description: string;
}

// Response types

/**
 * Response type for getting all checklist sets
 * GET /checklist-sets
 */
export interface GetAllChecklistSetsResponse {
  success: boolean;
  data: {
    checkListSets: {
      checkListSetId: string;
      name: string;
      description: string;
      processingStatus: CheckListStatus;
      isEditable: boolean;
    }[];
  };
}

/**
 * Response type for getting a presigned URL for checklist document upload
 * POST /documents/checklist/presigned-url
 */
export interface GetChecklistPresignedUrlResponse {
  success: boolean;
  data: {
    url: string;
    key: string;
    documentId: string;
  };
}

/**
 * Response type for deleting a checklist document
 * DELETE /documents/checklist/:key
 */
export interface DeleteChecklistDocumentResponse {
  success: boolean;
  data: {
    deleted: boolean;
  };
}

/**
 * Response type for getting checklist set detail
 * GET /checklist-sets/:setId/items/hierarchy
 */
export interface GetChecklistSetDetailResponse {
  success: boolean;
  data: {
    detail: CheckListItemModel[];
  };
}

/**
 * Response type for getting a checklist item
 * GET /checklist-sets/:setId/items/:itemId
 */
export interface GetChecklistItemResponse {
  success: boolean;
  data: {
    detail: CheckListItemModel;
  };
}

/**
 * Response type for creating a checklist set
 * POST /checklist-sets
 */
export interface CreateChecklistSetResponse {
  success: boolean;
  data: Record<string, never>;
}

/**
 * Response type for deleting a checklist set
 * DELETE /checklist-sets/:id
 */
export interface DeleteChecklistSetResponse {
  success: boolean;
  data: Record<string, never>;
}

/**
 * Response type for creating a checklist item
 * POST /checklist-sets/:setId/items
 */
export interface CreateChecklistItemResponse {
  success: boolean;
  data: Record<string, never>;
}

/**
 * Response type for updating a checklist item
 * PUT /checklist-sets/:setId/items/:itemId
 */
export interface UpdateChecklistItemResponse {
  success: boolean;
  data: Record<string, never>;
}

/**
 * Response type for deleting a checklist item
 * DELETE /checklist-sets/:setId/items/:itemId
 */
export interface DeleteChecklistItemResponse {
  success: boolean;
  data: Record<string, never>;
}

// Model types

/**
 * Checklist item model
 */
export interface CheckListItemModel {
  id: string;
  parentId?: string;
  setId: string;
  name: string;
  description?: string;
}

/**
 * Checklist document model
 */
export interface ChecklistDocumentModel {
  id: string;
  filename: string;
  s3Key: string;
  fileType: string;
  uploadDate: Date;
  status: CheckListStatus;
}

/**
 * Checklist set model
 */
export interface CheckListSetModel {
  id: string;
  name: string;
  description: string;
  documents: ChecklistDocumentModel[];
}

/**
 * Checklist set meta model (for list view)
 */
export interface CheckListSetMetaModel {
  id: string;
  name: string;
  description: string;
  processingStatus: CheckListStatus;
  isEditable: boolean;
}
