# チェックリストワークフロー拡張実装計画

## 概要

現在のチェックリストワークフロー（`document-page-processor.ts`）を拡張し、最終的に抽出されたチェックリスト項目をRDBに格納する機能を追加します。この拡張により、Step Functionsで処理されたチェックリスト項目が自動的にデータベースに保存され、APIを通じて利用可能になります。

## 現状分析

### 既存のワークフロー

現在のワークフローは以下のステップで構成されています：

1. `ProcessDocument`: ドキュメントを処理し、ページ分割を行う
2. ページ数に応じた処理方法の選択（小規模/中規模/大規模）
3. 各ページに対して並行処理：
   - `ExtractText`: テキスト抽出
   - `ProcessWithLLM`: LLMによるチェックリスト項目抽出
4. `CombinePageResults`: ページごとの結果を結合
5. `AggregateResults`: すべてのページの結果を集約

現在のワークフローでは、最終的な結果はS3に保存されますが、RDBには格納されていません。

### ID管理の現状

- `llm-processing.ts`では、LLMから抽出された各チェックリスト項目に`ulid()`を使用してIDを割り当てています
  - 具体的には、JSONパース後に各項目に`id: ulid()`を追加しています
  - これらのIDはS3に保存される際にも維持されます
- `aggregate-results/index.ts`では、各ページの結果を集約する際にこれらのIDを使用しています
- 最終的な結果は`getChecklistAggregateKey(documentId)`で指定されるS3パスに保存されています

### リポジトリの現状

- `ChecklistItemRepository`クラスの`createChecklistItem`メソッドは、内部で`ulid()`を使用して新しいIDを生成しています
  - 現在の実装では、外部からIDを指定することができません
- `ChecklistSetRepository`クラスは、チェックリストセットを作成するためのメソッドを提供しています
- `ChecklistSetService`クラスは、チェックリストセットを作成し、その後Step Functionsを開始しています
  - つまり、Step Functionsの実行前にチェックリストセットが既に作成されている可能性が高いです

### 呼び出し元の調査

`createChecklistItem`メソッドの呼び出し元を調査した結果：

- `ChecklistItemService`クラスの`createChecklistItem`メソッドが唯一の呼び出し元です
- このメソッドは、APIエンドポイントからの呼び出しに応じてチェックリスト項目を作成します
- 現在の実装では、IDを外部から指定する機能はありません
- スキーマ定義（`createChecklistItemSchema`）にもIDフィールドは含まれていません

## 実装計画

### 1. ChecklistItemRepositoryの修正

`ChecklistItemRepository`クラスを修正して、外部からIDを指定できるようにします。新規アプリケーションであり、互換性を考慮する必要がないため、IDを必須パラメータとします。

**ファイル**: `backend/src/api/features/checklist/repositories/checklist-item-repository.ts`

```typescript
/**
 * チェックリスト項目作成パラメータ
 */
export interface CreateChecklistItemParams {
  id: string; // 修正: 外部からIDを指定する必須パラメータに変更
  name: string;
  description?: string;
  parentId?: string | null;
  itemType: 'simple' | 'flow';
  isConclusion: boolean;
  flowData?: FlowData;
  checkListSetId: string;
  documentId?: string | null;
}

/**
 * チェックリスト項目リポジトリクラス
 */
export class ChecklistItemRepository {
  // ...既存のコード...

  /**
   * チェックリスト項目を作成する
   * @param params 作成パラメータ
   * @returns 作成されたチェックリスト項目
   */
  async createChecklistItem(params: CreateChecklistItemParams): Promise<CheckList> {
    return this.prisma.checkList.create({
      data: {
        id: params.id,
        name: params.name,
        description: params.description,
        parentId: params.parentId,
        itemType: params.itemType,
        isConclusion: params.isConclusion,
        flowData: params.flowData as any,
        checkListSetId: params.checkListSetId,
        documentId: params.documentId
      },
      include: {
        document: true
      }
    });
  }
  
  // ...既存のコード...
}
```

### 2. ChecklistItemServiceの修正

`ChecklistItemService`クラスを修正して、IDを生成して`createChecklistItem`メソッドに渡すようにします。

**ファイル**: `backend/src/api/features/checklist/services/checklist-item-service.ts`

```typescript
/**
 * チェックリスト項目を作成する
 * @param params 作成パラメータ
 * @param checkListSetId チェックリストセットID
 * @returns 作成されたチェックリスト項目
 * @throws 親項目が存在しない場合、ドキュメントが存在しない場合
 */
async createChecklistItem(params: Omit<CreateChecklistItemParams, 'checkListSetId' | 'id'>, checkListSetId: string) {
  // チェックリストセットが存在するか確認
  const checklistSet = await this.checklistSetRepository.getChecklistSetById(checkListSetId);
  
  if (!checklistSet) {
    throw new Error('チェックリストセットが見つかりません');
  }

  // 親項目が指定されている場合、存在確認と同じドキュメントに紐づけるルールを適用
  if (params.parentId) {
    const parentExists = await this.repository.checkItemBelongsToSet(params.parentId, checkListSetId);
    if (!parentExists) {
      throw new Error('親チェックリスト項目が見つかりません');
    }

    // 親項目のドキュメントIDを取得
    const parentDocumentId = await this.repository.getParentDocumentId(params.parentId);
    
    // 親項目と同じドキュメントに紐づける
    if (parentDocumentId && params.documentId && parentDocumentId !== params.documentId) {
      throw new Error('親項目と同じドキュメントに紐づける必要があります');
    } else if (parentDocumentId && !params.documentId) {
      params.documentId = parentDocumentId;
    }
  }

  // ドキュメントが指定されている場合、存在確認
  if (params.documentId) {
    const documentExists = await this.documentRepository.documentExists(params.documentId);
    if (!documentExists) {
      throw new Error('ドキュメントが見つかりません');
    }
  }

  // IDを生成
  const id = ulid();

  // チェックリスト項目を作成
  return this.repository.createChecklistItem({
    id,
    ...params,
    checkListSetId
  });
}
```

### 3. 新規Lambda関数の作成

S3に保存された集約結果をRDBに格納するための新しいLambda関数を作成します。この関数は、既存のチェックリストセットにチェックリスト項目を追加します。

**ファイル**: `backend/src/checklist-workflow/store-to-db/index.ts`

```typescript
/**
 * チェックリスト項目をRDBに格納する
 */
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getChecklistAggregateKey } from "../common/storage-paths";
import { ChecklistItem } from "../common/types";
import { ChecklistItemRepository } from "../../api/features/checklist/repositories/checklist-item-repository";
import { getPrismaClient } from "../../api/core/db";

export interface StoreToDbParams {
  documentId: string;
  checkListSetId: string;
}

export interface StoreToDbResult {
  documentId: string;
  checkListSetId: string;
  storedItemCount: number;
  success: boolean;
}

/**
 * S3から集約されたチェックリスト項目を取得してRDBに格納する
 * @param params パラメータ
 * @returns 処理結果
 */
export async function storeChecklistItemsToDb({
  documentId,
  checkListSetId,
}: StoreToDbParams): Promise<StoreToDbResult> {
  const s3Client = new S3Client({});
  const bucketName = process.env.DOCUMENT_BUCKET || "";
  const prisma = getPrismaClient();
  const checklistItemRepository = new ChecklistItemRepository(prisma);

  try {
    // S3から集約結果を取得
    const aggregateKey = getChecklistAggregateKey(documentId);
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: aggregateKey,
      })
    );

    const bodyContents = await response.Body?.transformToString();
    if (!bodyContents) {
      throw new Error(`S3オブジェクトの内容が空です: ${aggregateKey}`);
    }

    const checklistItems: ChecklistItem[] = JSON.parse(bodyContents);
    
    // トランザクションでRDBに格納
    let storedItemCount = 0;
    await prisma.$transaction(async (tx) => {
      const txRepository = new ChecklistItemRepository(tx as any);
      
      for (const item of checklistItems) {
        await txRepository.createChecklistItem({
          id: item.id, // LLM処理で生成されたIDをそのまま使用
          name: item.name,
          description: item.description,
          parentId: item.parent_id,
          itemType: item.item_type.toLowerCase() as 'simple' | 'flow',
          isConclusion: item.is_conclusion,
          flowData: item.flow_data,
          checkListSetId: checkListSetId,
          documentId: documentId
        });
        storedItemCount++;
      }
    });

    return {
      documentId,
      checkListSetId,
      storedItemCount,
      success: true,
    };
  } catch (error) {
    console.error(`RDBへの格納に失敗しました: ${error}`);
    throw new Error(`チェックリスト項目のRDBへの格納に失敗しました: ${error}`);
  }
}
```

### 4. Lambda関数のエントリポイントへの追加

**ファイル**: `backend/src/lambda.ts` (または同等のエントリポイントファイル)

```typescript
// 既存のimportに追加
import { storeChecklistItemsToDb } from "./checklist-workflow/store-to-db";

// 既存のハンドラー関数内に追加
case "storeToDb":
  return await storeChecklistItemsToDb(event);
```

### 5. Step Functions定義の拡張

**ファイル**: `cdk/lib/constructs/document-page-processor.ts`

```typescript
// 既存のimportはそのまま

export class DocumentPageProcessor extends Construct {
  // 既存のコードはそのまま

  constructor(scope: Construct, id: string, props: DocumentPageProcessorProps) {
    super(scope, id);

    // 既存のコードはそのまま

    // 結果統合Lambda
    const aggregateResultTask = new tasks.LambdaInvoke(
      this,
      "AggregateResults",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "aggregatePageResults",
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          processedPages: sfn.JsonPath.stringAt("$.processedPages"),
        }),
        outputPath: "$.Payload",
      }
    );

    // 新規追加: RDBに格納するLambda
    const storeToDbTask = new tasks.LambdaInvoke(
      this,
      "StoreToDb",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "storeToDb",
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          checkListSetId: sfn.JsonPath.stringAt("$.checkListSetId"),
        }),
        outputPath: "$.Payload",
      }
    ).addRetry({
      errors: [
        "Lambda.ServiceException",
        "Lambda.AWSLambdaException",
        "Lambda.SdkClientException",
        "Error",
      ],
      interval: Duration.seconds(2),
      backoffRate: 2,
      maxAttempts: 5,
    });

    // ワークフロー定義
    const definition = documentProcessorTask.next(pageCountChoice);

    // 各処理パスから結合タスクへの接続
    inlineMapState.next(aggregateResultTask);
    processMediumDocPass.next(aggregateResultTask);
    processLargeDocPass.next(aggregateResultTask);
    
    // 新規追加: 集約タスクからRDB格納タスクへの接続
    aggregateResultTask.next(storeToDbTask);

    // エラーハンドリングの設定
    documentProcessorTask.addCatch(handleErrorTask);
    aggregateResultTask.addCatch(handleErrorTask);
    storeToDbTask.addCatch(handleErrorTask); // 新規追加
    
    // 既存のコードはそのまま
  }
}
```

### 6. ChecklistSetServiceの修正

`ChecklistSetService`クラスを修正して、Step Functions実行時にチェックリストセットIDを渡すようにします。

**ファイル**: `backend/src/api/features/checklist/services/checklist-set-service.ts`

```typescript
/**
 * チェックリストセットを作成する
 * @param params 作成パラメータ
 * @returns 作成されたチェックリストセット
 */
async createChecklistSet(params: CreateChecklistSetParams) {
  // チェックリストセットを作成
  const checkListSet = await this.repository.createChecklistSet(params);
  
  // 各ドキュメントの処理を開始
  const stateMachineArn = process.env.DOCUMENT_PROCESSING_STATE_MACHINE_ARN;
  if (stateMachineArn) {
    for (const doc of params.documents) {
      try {
        await startStateMachineExecution(
          stateMachineArn,
          {
            documentId: doc.documentId,
            fileName: doc.filename,
            checkListSetId: checkListSet.id // チェックリストセットIDを追加
          }
        );
      } catch (error) {
        console.error(`Failed to start processing for document ${doc.documentId}:`, error);
        // エラーが発生しても処理を続行
      }
    }
  } else {
    console.warn('DOCUMENT_PROCESSING_STATE_MACHINE_ARN environment variable is not set. Document processing will not start.');
  }
  
  return checkListSet;
}
```

## 実装上の注意点

### ID管理

- `ChecklistItemRepository`クラスを修正して、外部からIDを指定できるようにします
- `ChecklistItemService`クラスを修正して、IDを生成して`createChecklistItem`メソッドに渡すようにします
- LLM処理で生成されたIDをそのままRDBのIDとして使用します
- 親子関係やフローデータの参照IDも、すでにULIDに変換されているため、そのまま使用できます

### チェックリストセットの作成

- `ChecklistSetService`クラスの分析から、Step Functionsの実行前にチェックリストセットが既に作成されていることがわかりました
- したがって、新しいLambda関数では、チェックリストセットを作成する必要はなく、既存のチェックリストセットにチェックリスト項目を追加するだけで十分です

### 影響範囲

- `ChecklistItemRepository`クラスの修正は、`createChecklistItem`メソッドの呼び出し元に影響を与えます
- 呼び出し元は`ChecklistItemService`クラスの`createChecklistItem`メソッドのみであることを確認しました
- `ChecklistItemService`クラスも修正して、IDを生成して渡すようにします

### トランザクション管理

- 複数のチェックリスト項目をRDBに格納する際は、トランザクションを使用して整合性を確保します
- エラーが発生した場合は、トランザクション全体をロールバックします

### エラーハンドリング

- RDBへの格納に失敗した場合は、Step Functionsのエラーハンドリング機能を使用して適切に対応します
- リトライ機能を使用して一時的な障害に対応します

## 修正・新規作成ファイル一覧

1. **修正**:
   - `backend/src/api/features/checklist/repositories/checklist-item-repository.ts`
   - `backend/src/api/features/checklist/services/checklist-item-service.ts`
   - `backend/src/api/features/checklist/services/checklist-set-service.ts`
   - `cdk/lib/constructs/document-page-processor.ts`
   - `backend/src/lambda.ts` (または同等のエントリポイントファイル)

2. **新規作成**:
   - `backend/src/checklist-workflow/store-to-db/index.ts`

## 検証計画

1. ユニットテスト:
   - `ChecklistItemRepository`と`ChecklistItemService`の修正が正しく動作することを確認
   - `storeChecklistItemsToDb`関数のテストを作成し、S3からの読み込みとRDBへの格納が正しく行われることを確認

2. 統合テスト:
   - Step Functionsを実行し、ワークフローが正常に完了することを確認
   - RDBにチェックリスト項目が正しく格納されていることを確認
   - 親子関係やフローデータの参照が正しく保存されていることを確認

3. エラーケースのテスト:
   - S3からの読み込みに失敗した場合のエラーハンドリングを確認
   - RDBへの格納に失敗した場合のエラーハンドリングを確認

## まとめ

この実装計画に従って、チェックリストワークフローを拡張し、抽出されたチェックリスト項目をRDBに格納する機能を追加します。`ChecklistItemRepository`クラスを修正して外部からIDを指定できるようにし、`ChecklistItemService`クラスも修正してIDを生成して渡すようにします。LLM処理で生成されたIDをそのままRDBのIDとして使用し、親子関係やフローデータの参照も正しく保存します。また、`ChecklistSetService`クラスの分析から、Step Functionsの実行前にチェックリストセットが既に作成されていることがわかったため、新しいLambda関数では既存のチェックリストセットにチェックリスト項目を追加するだけで十分です。
