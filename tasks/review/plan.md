以下の計画に基づいて実装を行います：

1. バックエンドでは一貫した命名規則を使用し、単一のエンドポイントで親 ID の有無によって階層を区別します
2. フロントエンドではページ表示時に一定の深さまで自動的にデータをロードします
3. 深い階層は必要に応じて展開時にロードします

## バックエンド実装

### 1. backend/src/api/features/review/routes/review-routes.ts の修正

typescript
// 既存のルートを修正
fastify.get(
"/review-jobs/:jobId/results/items",
{ schema: getReviewResultItemsSchema },
getReviewResultItemsHandler
);

// 古いエンドポイントは削除
// fastify.get(
// "/review-jobs/:jobId/results/hierarchy",
// { schema: getReviewResultHierarchySchema },
// getReviewResultHierarchyHandler
// );

### 2. backend/src/api/features/review/schemas/review-result-schemas.ts の修正

typescript
/\*\*

- 審査結果項目取得リクエストのスキーマ
  \*/
  export const getReviewResultItemsSchema: FastifySchema = {
  params: {
  type: "object",
  required: ["jobId"],
  properties: {
  jobId: { type: "string" },
  },
  },
  querystring: {
  type: "object",
  properties: {
  parentId: { type: "string" },
  },
  },
  response: {
  200: {
  type: "object",
  properties: {
  success: { type: "boolean" },
  data: {
  type: "array",
  items: {
  type: "object",
  properties: {
  review_result_id: { type: "string" },
  check_id: { type: "string" },
  status: { type: "string" },
  result: { type: ["string", "null"] },
  confidence_score: { type: ["number", "null"] },
  explanation: { type: ["string", "null"] },
  extracted_text: { type: ["string", "null"] },
  user_override: { type: "boolean" },
  user_comment: { type: ["string", "null"] },
  has_children: { type: "boolean" },
  check_list: {
  type: "object",
  properties: {
  check_id: { type: "string" },
  name: { type: "string" },
  description: { type: ["string", "null"] },
  parent_id: { type: ["string", "null"] },
  item_type: { type: "string" },
  is_conclusion: { type: "boolean" },
  flow_data: { type: ["object", "null"] },
  },
  },
  },
  },
  },
  },
  },
  404: {
  type: "object",
  properties: {
  success: { type: "boolean" },
  error: { type: "string" },
  },
  },
  500: {
  type: "object",
  properties: {
  success: { type: "boolean" },
  error: { type: "string" },
  },
  },
  },
  };

### 3. backend/src/api/features/review/handlers/review-result-handlers.ts の修正

typescript
/\*\*

- 審査結果項目取得ハンドラー
  \*/
  export async function getReviewResultItemsHandler(
  request: FastifyRequest<{
  Params: { jobId: string },
  Querystring: { parentId?: string }
  }>,
  reply: FastifyReply
  ): Promise<void> {
  try {
  const { jobId } = request.params;
  const { parentId } = request.query;
  const reviewResultService = new ReviewResultService();

      try {
        const items = await reviewResultService.getReviewResultItems(jobId, parentId);

        // レスポンス形式に変換
        const formattedData = items.map(item => ({
          review_result_id: item.id,
          check_id: item.checkId,
          status: item.status,
          result: item.result,
          confidence_score: item.confidenceScore,
          explanation: item.explanation,
          extracted_text: item.extractedText,
          user_override: item.userOverride,
          user_comment: item.userComment,
          has_children: item.hasChildren,
          check_list: item.checkList
            ? {
                check_id: item.checkList.id,
                name: item.checkList.name,
                description: item.checkList.description,
                parent_id: item.checkList.parentId,
                item_type: item.checkList.itemType,
                is_conclusion: item.checkList.isConclusion,
                flow_data: item.checkList.flowData,
              }
            : null,
        }));

        reply.code(200).send({
          success: true,
          data: formattedData,
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          request.log.error(`Job or parent item not found: ${jobId}, ${parentId}`);
          reply.code(404).send({
            success: false,
            error: parentId
              ? `審査ジョブまたは親項目が見つかりません`
              : `審査ジョブが見つかりません: ${jobId}`,
          });
          return;
        }
        throw error;
      }

  } catch (error) {
  request.log.error(error);
  reply.code(500).send({
  success: false,
  error: "審査結果項目の取得に失敗しました",
  });
  }
  }

### 4. backend/src/api/features/review/repositories/review-result-repository.ts の修正

typescript
/\*\*

- 親 ID に基づいて審査結果項目を取得する
- @param jobId 審査ジョブ ID
- @param parentId 親項目 ID（null の場合はルート項目を取得）
- @returns 審査結果項目の配列
  \*/
  async getReviewResultItemsByParentId(
  jobId: string,
  parentId: string | null
  ): Promise<ReviewResultDto[]> {
  return this.prisma.reviewResult.findMany({
  where: {
  reviewJobId: jobId,
  checkList: {
  parentId: parentId
  }
  },
  include: {
  checkList: true,
  },
  orderBy: {
  createdAt: "asc",
  },
  });
  }

/\*\*

- 特定の親項目を持つ審査結果の存在を確認する
- @param jobId 審査ジョブ ID
- @param checkIds チェック項目 ID の配列
- @returns チェック項目 ID ごとの子要素の有無
  \*/
  async hasChildrenByCheckIds(
  jobId: string,
  checkIds: string[]
  ): Promise<Map<string, boolean>> {
  if (checkIds.length === 0) {
  return new Map();
  }

const childrenCounts = await this.prisma.reviewResult.groupBy({
by: ['checkList'],
where: {
reviewJobId: jobId,
checkList: {
parentId: {
in: checkIds
}
}
},
\_count: {
id: true
}
});

const hasChildrenMap = new Map<string, boolean>();
checkIds.forEach(id => {
const count = childrenCounts.find(item => item.checkList === id);
hasChildrenMap.set(id, count ? count.\_count.id > 0 : false);
});

return hasChildrenMap;
}

### 5. backend/src/api/features/review/services/review-result-service.ts の修正

typescript
/\*\*

- 審査結果項目を取得する
- @param jobId 審査ジョブ ID
- @param parentId 親項目 ID（指定がない場合はルート項目を取得）
- @returns 審査結果項目の配列
  \*/
  async getReviewResultItems(
  jobId: string,
  parentId?: string
  ): Promise<(ReviewResultDto & { hasChildren: boolean })[]> {
  // 審査ジョブの存在確認
  const job = await this.jobRepository.getReviewJob(jobId);
  if (!job) {
  throw new Error(`Review job not found: ${jobId}`);
  }

// 親項目が指定されている場合、その存在を確認
if (parentId) {
const parentResult = await this.resultRepository.getReviewResult(parentId);
if (!parentResult || parentResult.reviewJobId !== jobId) {
throw new Error(`Parent result not found: ${parentId}`);
}
}

// 項目を取得
const items = await this.resultRepository.getReviewResultItemsByParentId(jobId, parentId || null);

// 子項目の有無を確認
const checkIds = items.map(item => item.checkId);
const hasChildrenMap = await this.resultRepository.hasChildrenByCheckIds(jobId, checkIds);

// 項目に子要素の有無情報を付与して返す
return items.map(item => ({
...item,
hasChildren: hasChildrenMap.get(item.checkId) || false
}));
}

### 6. backend/src/api/features/review/types.ts の修正

typescript
/\*\*

- 審査結果項目 DTO（子要素の有無情報を含む）
  \*/
  export interface ReviewResultItemDto extends ReviewResultDto {
  hasChildren: boolean;
  }

## フロントエンド実装

### 1. frontend/src/features/review/hooks/useReviewResultItems.ts（新規作成）

typescript
/\*\*

- 審査結果項目を取得するためのカスタムフック
  \*/
  import useHttp from '../../../hooks/useHttp';
  import { ReviewResultItem, ApiResponse } from '../types';

/\*\*

- 審査結果項目のキャッシュキーを生成する関数
  \*/
  export const getReviewResultItemsKey = (jobId?: string, parentId?: string) => {
  if (!jobId) return null;
  return `/review-jobs/${jobId}/results/items${parentId ? `?parentId=${parentId}` : ''}`;
  };

/\*\*

- 審査結果項目を取得するためのカスタムフック
- @param jobId 審査ジョブ ID
- @param parentId 親項目 ID（指定がない場合はルート項目を取得）
- @returns 審査結果項目、ローディング状態、エラー
  \*/
  export function useReviewResultItems(jobId?: string, parentId?: string): {
  items: ReviewResultItem[];
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
  } {
  const http = useHttp();
  const key = getReviewResultItemsKey(jobId, parentId);

const { data, error, isLoading, mutate } = http.get<ApiResponse<ReviewResultItem[]>>(key);

return {
items: data?.data || [],
isLoading,
isError: !!error,
mutate
};
}

### 2. frontend/src/features/review/types.ts の修正

typescript
/\*\*

- 審査結果項目
  \*/
  export interface ReviewResultItem {
  review_result_id: string;
  check_id: string;
  status: string;
  result: string | null;
  confidence_score: number | null;
  explanation: string | null;
  extracted_text: string | null;
  user_override: boolean;
  user_comment: string | null;
  has_children: boolean;
  check_list: {
  check_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  item_type: string;
  is_conclusion: boolean;
  flow_data?: any;
  };
  }

### 3. frontend/src/features/review/components/ReviewResultTreeNode.tsx（新規作成）

typescript
/\*\*

- 審査結果の階層構造のノードコンポーネント
- 子要素を動的に読み込む機能を持つ
  \*/
  import { useState, useEffect } from 'react';
  import { ReviewResultItem } from '../types';
  import ReviewResultItemComponent from './ReviewResultItem';
  import { useReviewResultItems } from '../hooks/useReviewResultItems';
  import Spinner from '../../../components/Spinner';

interface ReviewResultTreeNodeProps {
jobId: string;
item: ReviewResultItem;
level: number;
confidenceThreshold: number;
maxDepth?: number;
autoExpand?: boolean;
}

export default function ReviewResultTreeNode({
jobId,
item,
level,
confidenceThreshold,
maxDepth = 2,
autoExpand = false
}: ReviewResultTreeNodeProps) {
const [isExpanded, setIsExpanded] = useState(level < maxDepth || autoExpand);

// 子項目を取得（レベルが最大深度未満の場合は自動的に、それ以外は展開時に）
const shouldLoadChildren = item.has_children && (level < maxDepth || isExpanded);
const {
items: childItems,
isLoading: isLoadingChildren,
isError: isErrorChildren
} = useReviewResultItems(
jobId,
shouldLoadChildren ? item.check_id : undefined
);

// 展開/折りたたみの切り替え
const toggleExpand = () => {
setIsExpanded(!isExpanded);
};

// インデントのスタイル
const indentStyle = {
marginLeft: `${level * 20}px`,
};

return (
<div>
<div style={indentStyle}>
<ReviewResultItemComponent
result={{
            ...item,
            children: [] // ReviewResultItemコンポーネントの型との互換性のため
          }}
hasChildren={item.has_children}
isExpanded={isExpanded}
onToggleExpand={toggleExpand}
confidenceThreshold={confidenceThreshold}
isLoadingChildren={shouldLoadChildren && isLoadingChildren}
/>
</div>

      {/* 子項目を表示（展開時のみ） */}
      {isExpanded && item.has_children && (
        <div className="mt-2 space-y-2">
          {isLoadingChildren ? (
            <div className="flex justify-center py-4" style={{marginLeft: `${(level + 1) * 20}px`}}>
              <Spinner size="md" />
            </div>
          ) : isErrorChildren ? (
            <div className="text-red-500 py-2" style={{marginLeft: `${(level + 1) * 20}px`}}>
              子項目の読み込みに失敗しました。
            </div>
          ) : childItems.length > 0 ? (
            childItems.map(childItem => (
              <ReviewResultTreeNode
                key={childItem.review_result_id}
                jobId={jobId}
                item={childItem}
                level={level + 1}
                confidenceThreshold={confidenceThreshold}
                maxDepth={maxDepth}
              />
            ))
          ) : (
            <div className="text-gray-500 py-2" style={{marginLeft: `${(level + 1) * 20}px`}}>
              子項目はありません。
            </div>
          )}
        </div>
      )}
    </div>

);
}

### 4. frontend/src/features/review/components/ReviewResultTree.tsx の修正

typescript
/\*\*

- 審査結果の階層構造を表示するツリーコンポーネント
  \*/
  import { ReviewResultItem } from '../types';
  import ReviewResultTreeNode from './ReviewResultTreeNode';
  import { useReviewResultItems } from '../hooks/useReviewResultItems';
  import Spinner from '../../../components/Spinner';

interface ReviewResultTreeProps {
jobId: string;
confidenceThreshold: number;
maxDepth?: number;
}

export default function ReviewResultTree({ jobId, confidenceThreshold, maxDepth = 2 }: ReviewResultTreeProps) {
// ルート項目を取得
const {
items: rootItems,
isLoading: isLoadingRoot,
isError: isErrorRoot
} = useReviewResultItems(jobId);

if (isLoadingRoot) {
return (
<div className="flex justify-center items-center py-10">
<Spinner size="lg" />
</div>
);
}

if (isErrorRoot) {
return (
<div className="text-center py-10 text-red-500">
審査結果の読み込みに失敗しました。
</div>
);
}

if (rootItems.length === 0) {
return (
<div className="text-center py-10 text-gray-500">
審査結果がありません。
</div>
);
}

return (
<div className="space-y-4">
{rootItems.map((item) => (
<ReviewResultTreeNode 
          key={item.review_result_id} 
          jobId={jobId}
          item={item} 
          level={0} 
          confidenceThreshold={confidenceThreshold}
          maxDepth={maxDepth}
        />
))}
</div>
);
}

### 5. frontend/src/features/review/components/ReviewResultItem.tsx の修正

typescript
// 既存のコンポーネントに isLoadingChildren プロパティを追加
interface ReviewResultItemProps {
result: ReviewResultHierarchy;
hasChildren: boolean;
isExpanded: boolean;
onToggleExpand: () => void;
confidenceThreshold: number;
isLoadingChildren?: boolean; // 追加
}

// 展開/折りたたみボタンの部分を修正
{hasChildren && (
<button
onClick={onToggleExpand}
className="mr-2 text-aws-font-color-gray hover:text-aws-squid-ink-light transition-colors"
disabled={isLoadingChildren} // ローディング中は無効化

>

    {isExpanded ? (
      isLoadingChildren ? (
        <Spinner size="sm" /> // ローディング中はスピナーを表示
      ) : (
        <HiChevronDown className="h-5 w-5" />
      )
    ) : (
      <HiChevronRight className="h-5 w-5" />
    )}

  </button>
)}

### 6. frontend/src/features/review/pages/ReviewDetailPage.tsx の修正

typescript
// ReviewResultTree コンポーネントの使用部分を修正
{filteredHierarchy.length > 0 ? (
<ReviewResultTree
jobId={id!}
confidenceThreshold={confidenceThreshold}
maxDepth={2} // 最初に表示する深さを指定
/>
) : (

  <div className="text-center py-10">
    <p className="text-aws-font-color-gray">
      {hierarchy && hierarchy.length > 0 
        ? `選択したフィルタ条件に一致する審査結果がありません`
        : `審査結果がありません`}
    </p>
  </div>
)}

以上の実装により、以下の改善が実現されます：

1. バックエンドでは一貫した命名規則を使用し、単一のエンドポイントで親 ID の有無によって階層を区別
2. フロントエンドではページ表示時に一定の深さ（デフォルト 2 階層）まで自動的にデータをロード
3. 深い階層は展開時に動的にロード
4. 各ノードに子要素の有無情報を付与し、不要な API リクエストを削減
5. ローディング中はスピナーを表示してユーザーに視覚的なフィードバックを提供

これにより、初期レスポンスのサイズを大幅に削減しつつ、ユーザーエクスペリエンスを向上させることができます。
