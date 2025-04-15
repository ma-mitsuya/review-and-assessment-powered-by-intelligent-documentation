import { ReviewJob, Checklist } from './types';

export const mockReviewJobs: ReviewJob[] = [
  {
    id: '1',
    name: '不動産売買契約書審査',
    status: 'completed',
    documentName: '売買契約書_20250401.pdf',
    checklistName: '不動産売買契約書チェックリスト',
    createdAt: '2025-04-10T09:00:00Z',
    updatedAt: '2025-04-10T09:15:00Z',
  },
  {
    id: '2',
    name: '賃貸契約書審査',
    status: 'processing',
    documentName: '賃貸契約書_20250412.pdf',
    checklistName: '賃貸契約書チェックリスト',
    createdAt: '2025-04-12T14:30:00Z',
    updatedAt: '2025-04-12T14:30:00Z',
  },
  {
    id: '3',
    name: '建築確認申請書審査',
    status: 'pending',
    documentName: '建築確認申請書_20250414.pdf',
    checklistName: '建築確認申請書チェックリスト',
    createdAt: '2025-04-14T11:20:00Z',
    updatedAt: '2025-04-14T11:20:00Z',
  },
  {
    id: '4',
    name: '重要事項説明書審査',
    status: 'failed',
    documentName: '重要事項説明書_20250408.pdf',
    checklistName: '重要事項説明書チェックリスト',
    createdAt: '2025-04-08T16:45:00Z',
    updatedAt: '2025-04-08T17:00:00Z',
  },
];

export const mockChecklists: Checklist[] = [
  {
    id: '1',
    name: '不動産売買契約書チェックリスト',
    description: '不動産売買契約書の適合性チェック用リスト',
    itemCount: 15,
  },
  {
    id: '2',
    name: '賃貸契約書チェックリスト',
    description: '賃貸契約書の適合性チェック用リスト',
    itemCount: 12,
  },
  {
    id: '3',
    name: '建築確認申請書チェックリスト',
    description: '建築確認申請書の適合性チェック用リスト',
    itemCount: 20,
  },
  {
    id: '4',
    name: '重要事項説明書チェックリスト',
    description: '重要事項説明書の適合性チェック用リスト',
    itemCount: 18,
  },
];
