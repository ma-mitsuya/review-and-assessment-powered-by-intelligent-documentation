export interface ReviewJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  documentName: string;
  checklistName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  name: string;
  description: string;
  itemCount: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}
