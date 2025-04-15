import { useState } from 'react';
import { ReviewJob } from '../types';
import { mockReviewJobs } from '../mockData';

/**
 * 審査ジョブを管理するためのカスタムフック
 * 
 * 注意: 現在はモックデータを使用しています。
 * 将来的にはAPIと連携する実装に置き換える予定です。
 * 
 * @returns 審査ジョブ関連の状態と操作関数
 */
export const useReviewJobs = () => {
  const [jobs, setJobs] = useState<ReviewJob[]>(mockReviewJobs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ジョブ一覧を取得する関数
  const fetchJobs = async () => {
    // TBD: 実際のAPIからデータを取得する実装に置き換える
    setLoading(true);
    try {
      // モックデータを使用
      setJobs(mockReviewJobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  // 新しいジョブを作成する関数
  const createJob = async (jobData: Partial<ReviewJob>) => {
    // TBD: 実際のAPIを使用してジョブを作成する実装に置き換える
    setLoading(true);
    try {
      // モックの新規ジョブ作成
      const newJob: ReviewJob = {
        id: `new-${Date.now()}`,
        name: jobData.name || '新規審査ジョブ',
        status: 'pending',
        documentName: jobData.documentName || 'document.pdf',
        checklistName: jobData.checklistName || 'チェックリスト',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setJobs([newJob, ...jobs]);
      setError(null);
      return newJob;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create job'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    createJob,
  };
};

export default useReviewJobs;
