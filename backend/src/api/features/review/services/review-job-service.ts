/**
 * 審査ジョブサービス
 */
import { ReviewJobRepository } from "../repositories/review-job-repository";
import { ReviewResultRepository } from "../repositories/review-result-repository";
import { ReviewDocumentService } from "./review-document-service";
import {
  CreateReviewJobParams,
  GetReviewJobsParams,
  ReviewJobDto,
  ReviewJobSummary,
} from "../types";
import { generateId } from "../../../core/utils/id-generator";
import { getPrismaClient } from "../../../core/db";
import { REVIEW_JOB_STATUS } from "../constants";
import { startStateMachineExecution } from "../../../core/sfn";

/**
 * 審査ジョブサービス
 */
export class ReviewJobService {
  private jobRepository: ReviewJobRepository;
  private resultRepository: ReviewResultRepository;
  private documentService: ReviewDocumentService;

  constructor() {
    this.jobRepository = new ReviewJobRepository();
    this.resultRepository = new ReviewResultRepository();
    this.documentService = new ReviewDocumentService();
  }

  /**
   * 審査ジョブを作成する
   * @param params 審査ジョブ作成パラメータ
   * @returns 作成された審査ジョブ
   */
  async createReviewJob(params: CreateReviewJobParams): Promise<ReviewJobDto> {
    // 審査ジョブIDの生成
    const jobId = generateId();

    // チェックリストセットの存在確認
    const checkListSet = await getPrismaClient().checkListSet.findUnique({
      where: { id: params.checkListSetId },
    });

    if (!checkListSet) {
      throw new Error(`CheckList set not found: ${params.checkListSetId}`);
    }

    // 審査ジョブと審査ドキュメントを作成
    const job = await this.jobRepository.createReviewJob({
      id: jobId,
      name: params.name,
      documentId: params.documentId,
      checkListSetId: params.checkListSetId,
      userId: params.userId,
      filename: params.filename,
      s3Key: params.s3Key,
      fileType: params.fileType,
    });

    // 非同期で審査処理を開始
    const stateMachineArn = process.env.REVIEW_PROCESSING_STATE_MACHINE_ARN;
    if (stateMachineArn) {
      try {
        await startStateMachineExecution(stateMachineArn, {
          reviewJobId: jobId,
          documentId: params.documentId,
          fileName: params.filename,
        });

        // ステータスを処理中に更新
        await this.jobRepository.updateReviewJobStatus(
          jobId,
          REVIEW_JOB_STATUS.PROCESSING
        );
      } catch (error) {
        console.error(
          `Failed to start processing for review job ${jobId}:`,
          error
        );
      }
    }

    return job;
  }

  /**
   * 審査ジョブ一覧を取得する
   * @param params 取得パラメータ
   * @returns 審査ジョブ一覧と総数
   */
  async getReviewJobs(params: GetReviewJobsParams): Promise<{
    reviewJobs: Array<ReviewJobDto & { summary: ReviewJobSummary }>;
    total: number;
  }> {
    const { page, limit, sortBy, sortOrder, status } = params;
    const skip = (page - 1) * limit;

    // ソート条件の設定
    const orderBy: Record<string, string> = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || "asc";
    } else {
      orderBy["createdAt"] = "desc";
    }

    // リポジトリからデータを取得
    const [jobs, total] = await Promise.all([
      this.jobRepository.getReviewJobs({
        skip,
        take: limit,
        orderBy,
        status,
      }),
      this.jobRepository.getReviewJobsCount(status),
    ]);

    // 各ジョブのサマリー情報を取得
    const jobsWithSummary = await Promise.all(
      jobs.map(async (job) => {
        const summary = await this.resultRepository.getReviewResultsSummary(
          job.id
        );
        return {
          ...job,
          summary,
        };
      })
    );

    return {
      reviewJobs: jobsWithSummary,
      total,
    };
  }

  /**
   * 審査ジョブを取得する
   * @param jobId 審査ジョブID
   * @returns 審査ジョブと集計情報
   */
  async getReviewJob(
    jobId: string
  ): Promise<(ReviewJobDto & { summary: ReviewJobSummary }) | null> {
    const job = await this.jobRepository.getReviewJob(jobId);
    if (!job) {
      return null;
    }

    const summary = await this.resultRepository.getReviewResultsSummary(jobId);

    return {
      ...job,
      summary,
    };
  }

  /**
   * 審査ジョブを削除する
   * @param jobId 審査ジョブID
   * @returns 削除が成功したかどうか
   */
  async deleteReviewJob(jobId: string): Promise<boolean> {
    const job = await this.jobRepository.getReviewJob(jobId);
    if (!job) {
      throw new Error(`Review job not found: ${jobId}`);
    }

    // 審査ジョブを削除（関連する審査結果も削除される）
    await this.jobRepository.deleteReviewJob(jobId);

    return true;
  }
}
