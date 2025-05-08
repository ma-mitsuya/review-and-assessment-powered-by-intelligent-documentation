# チェックリストセット編集制限機能の実装計画

## 概要

チェックリストセットに審査ジョブが紐づいている場合、そのセット全体（および含まれるチェックリスト項目）の編集・追加・削除を制限する機能を実装します。これにより、審査結果の整合性を保ちます。

## 新規作成するファイル

なし（既存ファイルの修正のみ）

## 修正するファイル

### バックエンド側

1. /Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/repositories/checklist-set-repository.ts
   • チェックリストセットに審査ジョブが紐づいているかを確認するメソッドを追加
   • チェックリストセット一覧取得メソッドを編集可否情報を含むように修正

2. /Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/services/checklist-set-service.ts
   • 編集・削除前に審査ジョブの有無をチェックするロジックを追加

3. /Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/handlers/checklist-set-handlers.ts
   • エラーハンドリングとレスポンスの追加

4. /Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/services/checklist-item-service.ts
   • チェックリスト項目の編集・削除前にセットの編集可否を確認するロジックを追加

5. /Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/features/checklist/handlers/checklist-item-handlers.ts
   • エラーハンドリングとレスポンスの追加

### フロントエンド側

1. /Users/tksuzuki/projects/real-estate/aws-summit/beacon/frontend/src/features/checklist/hooks/useChecklistSet.ts
   • チェックリストセットの編集可否を確認するロジックを追加

2. /Users/tksuzuki/projects/real-estate/aws-summit/beacon/frontend/src/features/checklist/components/ChecklistSetList.tsx
   • 編集不可のチェックリストセットに警告アイコンを表示

3. /Users/tksuzuki/projects/real-estate/aws-summit/beacon/frontend/src/features/checklist/components/ChecklistSetDetail.tsx
   • 編集不可の場合に警告メッセージを表示し、編集ボタンを無効化

4. /Users/tksuzuki/projects/real-estate/aws-summit/beacon/frontend/src/features/checklist/components/ChecklistItemForm.tsx
   • チェックリストセットが編集不可の場合、項目の編集フォームを無効化

## 詳細な実装計画

### 1. バックエンド: チェックリストセットリポジトリの拡張

typescript
// checklist-set-repository.ts に追加
/\*\*

- チェックリストセットに紐づく審査ジョブの有無を確認する
- @param setId チェックリストセット ID
- @returns 審査ジョブが存在する場合は true、存在しない場合は false
  \*/
  async hasLinkedReviewJobs(setId: string): Promise<boolean> {
  const count = await this.prisma.reviewJob.count({
  where: { checkListSetId: setId }
  });
  return count > 0;
  }

/\*\*

- 審査ジョブが紐づいているチェックリストセット ID を一括取得
- @param setIds チェックリストセット ID の配列
- @returns 審査ジョブが紐づいているチェックリストセット ID の配列
  \*/
  async getSetIdsWithReviewJobs(setIds: string[]): Promise<string[]> {
  if (setIds.length === 0) {
  return [];
  }

const setsWithReviewJobs = await this.prisma.checkListSet.findMany({
where: {
id: { in: setIds },
reviewJobs: { some: {} }
},
select: { id: true }
});

return setsWithReviewJobs.map(set => set.id);
}

/\*\*

- チェックリストセット一覧を取得する（編集可否情報を含む）
- @param params 取得パラメータ
- @returns チェックリストセット一覧と総数
  _/
  async getChecklistSets(params: GetChecklistSetsParams): Promise<{
  checkListSets: Array<ChecklistSetDto & { isEditable: boolean }>;
  total: number;
  }> {
  const { page, limit, sortBy, sortOrder } = params;
  const skip = (page - 1) _ limit;

// ソート条件の設定
const orderBy: Record<string, string> = {};
if (sortBy) {
orderBy[sortBy] = sortOrder || "asc";
} else {
orderBy["name"] = "asc";
}

// チェックリストセット一覧を取得
const [checkListSets, total] = await Promise.all([
this.prisma.checkListSet.findMany({
skip,
take: limit,
orderBy,
}),
this.prisma.checkListSet.count(),
]);

if (checkListSets.length === 0) {
return { checkListSets: [], total };
}

// チェックリストセット ID の配列を作成
const setIds = checkListSets.map(set => set.id);

// 審査ジョブが紐づいているセット ID を取得
const setIdsWithReviewJobs = await this.getSetIdsWithReviewJobs(setIds);
const setIdsWithReviewJobsSet = new Set(setIdsWithReviewJobs);

// 編集可否情報を追加
const checkListSetsWithEditability = checkListSets.map(set => ({
...set,
isEditable: !setIdsWithReviewJobsSet.has(set.id)
}));

return {
checkListSets: checkListSetsWithEditability,
total
};
}

/\*\*

- チェックリストセットの詳細を取得する（編集可否情報を含む）
- @param id チェックリストセット ID
- @returns チェックリストセット詳細と編集可否情報
  \*/
  async getChecklistSetById(id: string): Promise<(ChecklistSetDto & { isEditable: boolean }) | null> {
  const checkListSet = await this.prisma.checkListSet.findUnique({
  where: { id }
  });

if (!checkListSet) {
return null;
}

// 審査ジョブの有無を確認
const isEditable = !(await this.hasLinkedReviewJobs(id));

return {
...checkListSet,
isEditable
};
}

### 2. バックエンド: チェックリストセットサービスの拡張

typescript
// checklist-set-service.ts に追加
/\*\*

- チェックリストセットが編集可能かどうかを確認する
- @param setId チェックリストセット ID
- @returns 編集可能な場合は true、不可能な場合は false
  \*/
  async isChecklistSetEditable(setId: string): Promise<boolean> {
  return !(await this.checklistSetRepository.hasLinkedReviewJobs(setId));
  }

// updateChecklistSet メソッドを修正
async updateChecklistSet(
setId: string,
params: UpdateChecklistSetParams
): Promise<ChecklistSetDto> {
// 編集可能かどうかを確認
const isEditable = await this.isChecklistSetEditable(setId);

if (!isEditable) {
throw new Error("LINKED_REVIEW_JOBS");
}

// 既存の更新処理
return this.checklistSetRepository.updateChecklistSet(setId, params);
}

// deleteChecklistSet メソッドも同様に修正
async deleteChecklistSet(setId: string): Promise<boolean> {
// 編集可能かどうかを確認
const isEditable = await this.isChecklistSetEditable(setId);

if (!isEditable) {
throw new Error("LINKED_REVIEW_JOBS");
}

// 既存の削除処理
return this.checklistSetRepository.deleteChecklistSet(setId);
}

### 3. バックエンド: チェックリストセットハンドラーの拡張

typescript
// checklist-set-handlers.ts の updateChecklistSetHandler を修正
export async function updateChecklistSetHandler(
request: FastifyRequest<{
Params: { id: string };
Body: UpdateChecklistSetParams;
}>,
reply: FastifyReply
): Promise<void> {
try {
// 既存の処理
// ...
} catch (error) {
request.log.error(error);

    if (error instanceof Error) {
      if (error.message === "LINKED_REVIEW_JOBS") {
        reply.code(400).send({
          success: false,
          error: "このチェックリストセットは審査ジョブに紐づいているため編集できません",
          code: "LINKED_REVIEW_JOBS"
        });
        return;
      }
      // その他のエラー処理
    }

    reply.code(500).send({
      success: false,
      error: "チェックリストセットの更新に失敗しました",
    });

}
}

// deleteChecklistSetHandler も同様に修正

### 4. バックエンド: チェックリスト項目サービスの拡張

typescript
// checklist-item-service.ts に追加
/\*\*

- チェックリスト項目が属するセットが編集可能かどうかを確認する
- @param checkId チェックリスト項目 ID
- @returns 編集可能な場合は true、不可能な場合は false
  \*/
  async isChecklistItemEditable(checkId: string): Promise<boolean> {
  // チェックリスト項目を取得
  const item = await this.checklistItemRepository.getChecklistItem(checkId);

if (!item) {
throw new Error("Checklist item not found");
}

// チェックリストセットの編集可否を確認
const checklistSetService = new ChecklistSetService();
return checklistSetService.isChecklistSetEditable(item.checkListSetId);
}

// updateChecklistItem メソッドを修正
async updateChecklistItem(
checkId: string,
params: UpdateChecklistItemParams
): Promise<ChecklistItemDto> {
// 編集可能かどうかを確認
const isEditable = await this.isChecklistItemEditable(checkId);

if (!isEditable) {
throw new Error("LINKED_REVIEW_JOBS");
}

// 既存の更新処理
return this.checklistItemRepository.updateChecklistItem(checkId, params);
}

// deleteChecklistItem メソッドも同様に修正
async deleteChecklistItem(checkId: string): Promise<boolean> {
// 編集可能かどうかを確認
const isEditable = await this.isChecklistItemEditable(checkId);

if (!isEditable) {
throw new Error("LINKED_REVIEW_JOBS");
}

// 既存の削除処理
return this.checklistItemRepository.deleteChecklistItem(checkId);
}

// createChecklistItem メソッドも修正
async createChecklistItem(
setId: string,
params: CreateChecklistItemParams
): Promise<ChecklistItemDto> {
// セットが編集可能かどうかを確認
const checklistSetService = new ChecklistSetService();
const isEditable = await checklistSetService.isChecklistSetEditable(setId);

if (!isEditable) {
throw new Error("LINKED_REVIEW_JOBS");
}

// 既存の作成処理
return this.checklistItemRepository.createChecklistItem(setId, params);
}

### 5. バックエンド: チェックリスト項目ハンドラーの拡張

typescript
// checklist-item-handlers.ts の updateChecklistItemHandler を修正
export async function updateChecklistItemHandler(
request: FastifyRequest<{
Params: { setId: string; itemId: string };
Body: UpdateChecklistItemParams;
}>,
reply: FastifyReply
): Promise<void> {
try {
// 既存の処理
// ...
} catch (error) {
request.log.error(error);

    if (error instanceof Error) {
      if (error.message === "LINKED_REVIEW_JOBS") {
        reply.code(400).send({
          success: false,
          error: "このチェックリスト項目は審査ジョブに紐づいているチェックリストセットに属しているため編集できません",
          code: "LINKED_REVIEW_JOBS"
        });
        return;
      }
      // その他のエラー処理
    }

    reply.code(500).send({
      success: false,
      error: "チェックリスト項目の更新に失敗しました",
    });

}
}

// createChecklistItemHandler と deleteChecklistItemHandler も同様に修正

### 6. フロントエンド: チェックリストセットフックの拡張

typescript
// useChecklistSet.ts を修正
export function useChecklistSet(setId: string) {
const [data, setData] = useState<ChecklistSetWithEditability | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(true);
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
async function fetchChecklistSet() {
try {
setIsLoading(true);
const response = await fetch(`/api/checklist-sets/${setId}`);
const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(new Error(result.error));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchChecklistSet();

}, [setId]);

return { data, isLoading, error };
}

### 7. フロントエンド: チェックリストセット一覧コンポーネントの拡張

tsx
// ChecklistSetList.tsx を修正
function ChecklistSetList() {
const { data, isLoading } = useChecklistSets();

// 各チェックリストセットのレンダリング
const renderChecklistSet = (set) => {
return (
<div key={set.check_list_set_id} className="border p-4 rounded">
<div className="flex justify-between items-center">
<h3 className="text-lg font-semibold">{set.name}</h3>

          {/* 編集不可の場合に警告アイコンを表示 */}
          {!set.is_editable && (
            <div className="text-amber-500 flex items-center">
              <ExclamationIcon className="w-5 h-5 mr-1" />
              <span className="text-sm">審査に使用中</span>
            </div>
          )}
        </div>

        <p className="text-gray-600">{set.description}</p>

        <div className="mt-4 flex space-x-2">
          <Link to={`/checklist-sets/${set.check_list_set_id}`}>
            <Button>詳細</Button>
          </Link>

          {/* 編集ボタンは編集可能な場合のみ有効化 */}
          <Link to={`/checklist-sets/${set.check_list_set_id}/edit`}>
            <Button
              disabled={!set.is_editable}
              className={!set.is_editable ? "opacity-50 cursor-not-allowed" : ""}
            >
              編集
            </Button>
          </Link>
        </div>
      </div>
    );

};

return (
<div>
<h2 className="text-xl font-bold mb-4">チェックリストセット一覧</h2>

      {isLoading ? (
        <div>読み込み中...</div>
      ) : (
        <div className="space-y-4">
          {data?.checkListSets.map(renderChecklistSet)}
        </div>
      )}
    </div>

);
}

### 8. フロントエンド: チェックリストセット詳細コンポーネントの拡張

tsx
// ChecklistSetDetail.tsx を修正
function ChecklistSetDetail({ setId }) {
const { data: checklistSet, isLoading } = useChecklistSet(setId);

// 編集不可の場合の警告メッセージ
const renderEditabilityWarning = () => {
if (checklistSet && !checklistSet.is_editable) {
return (
<div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-6">
<div className="flex items-center text-amber-700">
<ExclamationIcon className="w-5 h-5 mr-2" />
<span className="font-medium">このチェックリストセットは審査ジョブに紐づいているため編集できません</span>
</div>
<p className="mt-2 text-amber-600 text-sm">
編集が必要な場合は、このチェックリストセットを複製して新しいバージョンを作成してください。
</p>
</div>
);
}
return null;
};

// 残りのコンポーネント実装
// ...

return (
<div>
{/_ 編集可否の警告メッセージ _/}
{renderEditabilityWarning()}

      {/* チェックリストセットの詳細表示 */}
      {/* ... */}

      {/* 編集ボタン */}
      <Button
        onClick={handleEdit}
        disabled={checklistSet && !checklistSet.is_editable}
        className={checklistSet && !checklistSet.is_editable ? "opacity-50 cursor-not-allowed" : ""}
      >
        編集
      </Button>

      {/* 複製ボタン（編集不可の場合に代替手段として提供） */}
      {checklistSet && !checklistSet.is_editable && (
        <Button onClick={handleDuplicate} className="ml-2">
          複製して新規作成
        </Button>
      )}
    </div>

);
}

### 9. フロントエンド: チェックリスト項目フォームの拡張

tsx
// ChecklistItemForm.tsx を修正
function ChecklistItemForm({ setId, itemId, onSubmit }) {
const { data: checklistSet } = useChecklistSet(setId);
const isEditable = checklistSet?.is_editable ?? false;

// フォームが送信されたときの処理
const handleSubmit = async (values) => {
if (!isEditable) {
// 編集不可の場合はエラーメッセージを表示
toast.error("このチェックリストセットは審査ジョブに紐づいているため編集できません");
return;
}

    // 通常の送信処理
    onSubmit(values);

};

return (
<Form onSubmit={handleSubmit}>
{/_ フォームの内容 _/}
{/_ ... _/}

      {/* 送信ボタン */}
      <Button
        type="submit"
        disabled={!isEditable}
        className={!isEditable ? "opacity-50 cursor-not-allowed" : ""}
      >
        保存
      </Button>

      {/* 編集不可の場合の警告メッセージ */}
      {!isEditable && (
        <div className="text-amber-600 mt-2">
          このチェックリストセットは審査ジョブに紐づいているため編集できません
        </div>
      )}
    </Form>

);
}

## 実装上の注意点

1. パフォーマンス最適化:
   • チェックリストセット一覧取得時に、各セットの編集可否情報を一括で取得するようにしています
   • N+1 問題を避けるため、Prisma の効率的なクエリを使用しています

2. ユーザー体験:
   • 単に機能を無効化するだけでなく、なぜ編集できないのかを明確に説明するメッセージを表示します
   • 「複製して新規作成」などの代替手段を提供します

3. エラーハンドリング:
   • フロントエンドでのエラー表示は、ユーザーにとって理解しやすい形式にしています
   • バックエンドからのエラーコードを適切に解釈して表示します

4. 複製機能の実装:
   • 編集不可のチェックリストセットを複製する機能を提供することで、ユーザーの利便性を向上させます
   • 複製時には新しい ID を生成し、審査ジョブとの紐づけはコピーしないようにします

5. テスト:
   • 審査ジョブが紐づいている場合と紐づいていない場合の両方のシナリオをテストします
   • エラーケースのハンドリングも適切にテストします

この実装計画に基づいて、チェックリストセットの編集制限機能を効率的に実装することができます。
