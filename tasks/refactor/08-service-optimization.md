# サービスクラス最適化計画

## 1. サービスクラスの単一責務化

### 修正方針

1. メソッドの責務を明確に分離
2. 内部でのみ使用されるメソッドをprivateに変更
3. 新しいエラークラスを使用したエラーハンドリング
4. 長いメソッドを複数の小さなメソッドに分割

### 例: ChecklistSetServiceの最適化

```typescript
/**
 * チェックリストセットサービス
 */
export class ChecklistSetService {
  private repository: ChecklistSetRepository;
  private documentRepository: DocumentRepository;
  private coreDocumentService: CoreDocumentService;

  constructor() {
    this.repository = new ChecklistSetRepository();
    this.documentRepository = new DocumentRepository();
    this.coreDocumentService = new CoreDocumentService();
  }

  /**
   * チェックリストセットを作成する
   * @param params 作成パラメータ
   * @returns 作成されたチェックリストセット
   */
  async createChecklistSet(params: CreateChecklistSetParams) {
    // チェックリストセットを作成
    const checkListSet = await this.repository.createChecklistSet(params);

    // 各ドキュメントの処理を開始
    await this.startDocumentProcessing(checkListSet.id, params.documents);

    return checkListSet;
  }

  /**
   * チェックリストセット一覧を取得する
   * @param params 取得パラメータ
   * @returns チェックリストセット一覧と総数
   */
  async getChecklistSets(
    params: GetChecklistSetsParams
  ): Promise<GetChecklistSetsResult> {
    const { page, limit, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    // ソート条件の設定
    const orderBy = this.buildOrderByClause(sortBy, sortOrder);

    // リポジトリからデータを取得
    const [checklistSets, total] = await Promise.all([
      this.repository.getChecklistSets({
        skip,
        take: limit,
        orderBy,
      }),
      this.repository.getChecklistSetsCount(),
    ]);

    // チェックリストセットIDの配列を作成
    const setIds = checklistSets.map(set => set.id);
    
    // 審査ジョブが紐づいているセットIDを取得
    const setIdsWithReviewJobs = await this.repository.getSetIdsWithReviewJobs(setIds);
    const setIdsWithReviewJobsSet = new Set(setIdsWithReviewJobs);

    // 処理状態を計算してレスポンス形式に変換
    const checkListSets = this.formatChecklistSets(checklistSets, setIdsWithReviewJobsSet);

    return {
      checkListSets,
      total,
    };
  }

  /**
   * チェックリストセットを更新する
   * @param setId チェックリストセットID
   * @param params 更新パラメータ
   * @returns 更新されたチェックリストセット
   * @throws 審査ジョブが紐づいている場合はエラー
   */
  async updateChecklistSet(
    setId: string,
    params: UpdateChecklistSetParams
  ) {
    // 編集可能かどうかを確認
    const isEditable = await this.isChecklistSetEditable(setId);

    if (!isEditable) {
      throw new LinkedResourceError("このチェックリストセットは審査ジョブに紐づいているため編集できません");
    }

    // チェックリストセットを更新
    return this.repository.updateChecklistSet(setId, params);
  }

  /**
   * チェックリストセットを削除する
   * @param checklistSetId チェックリストセットID
   * @returns 削除が成功したかどうか
   * @throws エラーが発生した場合
   */
  async deleteChecklistSet(checklistSetId: string): Promise<boolean> {
    // 編集可能かどうかを確認
    const isEditable = await this.isChecklistSetEditable(checklistSetId);

    if (!isEditable) {
      throw new LinkedResourceError("このチェックリストセットは審査ジョブに紐づいているため削除できません");
    }

    // 関連するドキュメント情報を取得
    const documents = await this.documentRepository.getDocumentsByChecklistSetId(checklistSetId);

    // DBからチェックリストセットとその関連データを削除
    await this.repository.deleteChecklistSetWithRelations(checklistSetId);

    // S3から関連するすべてのファイルを削除
    await this.deleteS3Files(documents);

    return true;
  }

  /**
   * チェックリストセットが編集可能かどうかを確認する
   * @param setId チェックリストセットID
   * @returns 編集可能な場合はtrue、不可能な場合はfalse
   */
  async isChecklistSetEditable(setId: string): Promise<boolean> {
    return !(await this.repository.hasLinkedReviewJobs(setId));
  }

  /**
   * ドキュメント処理を開始する
   * @param checkListSetId チェックリストセットID
   * @param documents ドキュメント情報配列
   * @private
   */
  private async startDocumentProcessing(checkListSetId: string, documents: DocumentInfo[]): Promise<void> {
    const stateMachineArn = process.env.DOCUMENT_PROCESSING_STATE_MACHINE_ARN;
    if (!stateMachineArn) {
      console.warn(
        "DOCUMENT_PROCESSING_STATE_MACHINE_ARN environment variable is not set. Document processing will not start."
      );
      return;
    }

    for (const doc of documents) {
      try {
        await startStateMachineExecution(stateMachineArn, {
          documentId: doc.documentId,
          fileName: doc.filename,
          checkListSetId: checkListSetId,
        });
      } catch (error) {
        console.error(
          `Failed to start processing for document ${doc.documentId}:`,
          error
        );
        // エラーが発生しても処理を続行
      }
    }
  }

  /**
   * ソート条件を構築する
   * @param sortBy ソート項目
   * @param sortOrder ソート順序
   * @returns ソート条件オブジェクト
   * @private
   */
  private buildOrderByClause(sortBy?: string, sortOrder?: "asc" | "desc"): Record<string, string> {
    const orderBy: Record<string, string> = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || "asc";
    } else {
      // createdAtフィールドがないため、idでソート
      orderBy["id"] = "desc";
    }
    return orderBy;
  }

  /**
   * チェックリストセットをレスポンス形式に変換する
   * @param checklistSets チェックリストセット配列
   * @param setIdsWithReviewJobsSet 審査ジョブが紐づいているセットIDのセット
   * @returns レスポンス形式のチェックリストセット配列
   * @private
   */
  private formatChecklistSets(
    checklistSets: ChecklistSetWithDocuments[],
    setIdsWithReviewJobsSet: Set<string>
  ) {
    return checklistSets.map((set) => {
      const processingStatus = this.calculateProcessingStatus(set.documents);
      const isEditable = !setIdsWithReviewJobsSet.has(set.id);
      
      return {
        check_list_set_id: set.id,
        name: set.name,
        description: set.description,
        processing_status: processingStatus,
        is_editable: isEditable,
      };
    });
  }

  /**
   * S3からファイルを削除する
   * @param documents ドキュメント配列
   * @private
   */
  private async deleteS3Files(documents: CheckListDocument[]): Promise<void> {
    const bucketName = process.env.DOCUMENT_BUCKET || "beacon-documents";
    for (const document of documents) {
      try {
        await this.coreDocumentService.deleteS3File(
          bucketName,
          document.s3Path
        );
      } catch (s3Error) {
        console.error(
          `S3 deletion failed for document ${document.id}:`,
          s3Error
        );
        // S3削除エラーは致命的ではないので続行
      }
    }
  }

  /**
   * ドキュメントの状態からチェックリストセットの処理状態を計算
   * @param documents ドキュメント配列
   * @returns 処理状態
   * @private
   */
  private calculateProcessingStatus(
    documents: CheckListDocument[]
  ): "pending" | "in_progress" | "completed" {
    if (documents.length === 0) {
      return "pending";
    }

    const hasProcessing = documents.some((doc) => doc.status === "processing");
    if (hasProcessing) {
      return "in_progress";
    }

    const allCompleted = documents.every((doc) => doc.status === "completed");
    if (allCompleted) {
      return "completed";
    }

    return "pending";
  }
}
```

## 2. エラーハンドリングの改善

### 修正方針

1. 専用のException classを使用
2. エラーメッセージの集中管理
3. エラーコードの統一

### 例: ReviewJobServiceの最適化

```typescript
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
    throw new NotFoundError('CheckList set', params.checkListSetId);
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
  await this.startReviewProcessing(jobId, params);

  return job;
}

/**
 * 審査処理を開始する
 * @param jobId 審査ジョブID
 * @param params 審査ジョブ作成パラメータ
 * @private
 */
private async startReviewProcessing(jobId: string, params: CreateReviewJobParams): Promise<void> {
  const stateMachineArn = process.env.REVIEW_PROCESSING_STATE_MACHINE_ARN || 
    "arn:aws:states:ap-northeast-1:151364017355:stateMachine:ReviewProcessorReviewProcessingWorkflowED301F52-PC1Cl3uJSKer";
  
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
}
```

## 実装方針

1. 各サービスクラスのメソッドを単一責務の原則に従って分割
2. 内部でのみ使用されるメソッドをprivateに変更
3. 新しいエラークラスを使用したエラーハンドリングを導入
4. コメントを適切に更新
