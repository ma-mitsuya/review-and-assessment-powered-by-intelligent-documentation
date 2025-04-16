# 修正計画

## 背景

現在、チェックリスト新規作成機能では、ファイルのアップロードから作成までの一連の流れが実装されています。具体的には、pre-signed URL による S3 へのファイルアップロード、ゴミ箱アイコンクリックによるファイル削除、作成ボタ
ンクリックによるバックエンドへのリクエスト送信、そしてトランザクションによる複数テーブルの同時更新という流れです。

一方、審査作成機能では同様の流れが実装されておらず、ユーザー体験に一貫性がありません。この問題を解決するため、チェックリスト新規作成と同様のドキュメントアップロード機能を審査作成機能にも実装し、共通部分をコア機能と
して抽出することで、コードの重複を減らし保守性を向上させる必要があります。

## バックエンド側の修正

### 1. 共通化する部分

#### 1.1 ID 生成ユーティリティの移動

• **削除**: /src/api/features/checklist/utils/id-generator.ts
• **新規作成**: /src/api/core/utils/id-generator.ts
typescript
import { ulid } from 'ulid';

export function generateId(): string {
return ulid();
}

#### 1.2 ドキュメント処理の共通化

• **新規作成**: /src/api/core/document/document-service.ts
typescript
import { getPresignedUrl as getS3PresignedUrl, deleteS3Object } from '../aws';
import { generateId } from '../utils/id-generator';

export class CoreDocumentService {
async getPresignedUrl(
bucketName: string,
keyGenerator: (documentId: string, filename: string) => string,
filename: string,
contentType: string
): Promise<{ url: string; key: string; documentId: string }> {
const documentId = generateId();
const key = keyGenerator(documentId, filename);
const url = await getS3PresignedUrl(bucketName, key, contentType);

    return { url, key, documentId };

}

async deleteS3File(bucketName: string, key: string): Promise<boolean> {
await deleteS3Object(bucketName, key);
return true;
}
}

### 2. 審査ジョブ関連の修正

#### 2.1 ReviewJobRepository の修正

• **修正**: /src/api/features/review/repositories/review-job-repository.ts
typescript
// createReviewJob メソッドを修正
async createReviewJob(params: {
id: string;
name: string;
documentId: string;
checkListSetId: string;
userId?: string;
// 追加のパラメータ
filename?: string;
s3Path?: string;
fileType?: string;
}): Promise<ReviewJobDto> {
const now = new Date();

// ドキュメントアップロード情報がある場合はトランザクションで処理
if (params.filename && params.s3Path && params.fileType) {
return this.prisma.$transaction(async (tx) => {
// 審査ドキュメントを作成
await tx.reviewDocument.create({
data: {
id: params.documentId,
filename: params.filename,
s3Path: params.s3Path,
fileType: params.fileType,
uploadDate: now,
status: 'processing'
}
});

      // 審査ジョブを作成
      const job = await tx.reviewJob.create({
        data: {
          id: params.id,
          name: params.name,
          status: 'pending',
          documentId: params.documentId,
          checkListSetId: params.checkListSetId,
          createdAt: now,
          updatedAt: now,
          userId: params.userId
        },
        include: {
          document: true,
          checkListSet: true
        }
      });

      // チェックリスト項目を取得して審査結果を作成
      const checkListSet = await tx.checkListSet.findUnique({
        where: { id: params.checkListSetId },
        include: { checkLists: true }
      });

      if (checkListSet) {
        for (const checkList of checkListSet.checkLists) {
          await tx.reviewResult.create({
            data: {
              id: generateId(),
              reviewJobId: params.id,
              checkId: checkList.id,
              status: 'pending',
              userOverride: false,
              createdAt: now,
              updatedAt: now
            }
          });
        }
      }

      return job;
    });

} else {
// 既存の処理（既に DB に登録されているドキュメントを使用）
return this.prisma.reviewJob.create({
data: {
id: params.id,
name: params.name,
status: 'pending',
documentId: params.documentId,
checkListSetId: params.checkListSetId,
createdAt: now,
updatedAt: now,
userId: params.userId
},
include: {
document: true,
checkListSet: true
}
});
}
}

#### 2.2 ReviewJobService の修正

• **修正**: /src/api/features/review/services/review-job-service.ts
typescript
// createReviewJob メソッドを修正
async createReviewJob(params: {
name: string;
documentId: string;
checkListSetId: string;
userId?: string;
// 追加のパラメータ
filename?: string;
s3Key?: string;
fileType?: string;
}): Promise<ReviewJobDto> {
// 審査ジョブ ID の生成
const jobId = generateId();

// チェックリストセットの存在確認
const checkListSet = await getPrismaClient().checkListSet.findUnique({
where: { id: params.checkListSetId }
});

if (!checkListSet) {
throw new Error(`CheckList set not found: ${params.checkListSetId}`);
}

// ドキュメントアップロード情報がある場合
if (params.filename && params.s3Key && params.fileType) {
// 審査ジョブと審査ドキュメントを作成
const job = await this.jobRepository.createReviewJob({
id: jobId,
name: params.name,
documentId: params.documentId,
checkListSetId: params.checkListSetId,
userId: params.userId,
filename: params.filename,
s3Path: params.s3Key,
fileType: params.fileType
});

    // 非同期で審査処理を開始
    const stateMachineArn = process.env.REVIEW_PROCESSING_STATE_MACHINE_ARN;
    if (stateMachineArn) {
      try {
        await startStateMachineExecution(
          stateMachineArn,
          {
            reviewJobId: jobId,
            documentId: params.documentId,
            fileName: params.filename
          }
        );

        // ステータスを処理中に更新
        await this.jobRepository.updateReviewJobStatus(jobId, 'processing');
      } catch (error) {
        console.error(`Failed to start processing for review job ${jobId}:`, error);
      }
    }

    return job;

} else {
// 既存の処理（既に DB に登録されているドキュメントを使用）
const document = await getPrismaClient().reviewDocument.findUnique({
where: { id: params.documentId }
});

    if (!document) {
      throw new Error(`Review document not found: ${params.documentId}`);
    }

    return this.jobRepository.createReviewJob({
      id: jobId,
      name: params.name,
      documentId: params.documentId,
      checkListSetId: params.checkListSetId,
      userId: params.userId
    });

}
}

#### 2.3 ReviewDocumentService の修正

• **修正**: /src/api/features/review/services/review-document-service.ts
typescript
// CoreDocumentService を使用するように修正
import { CoreDocumentService } from '../../../core/document/document-service';

export class ReviewDocumentService {
private coreDocumentService: CoreDocumentService;
private repository: ReviewDocumentRepository;

constructor() {
this.coreDocumentService = new CoreDocumentService();
this.repository = new ReviewDocumentRepository();
}

// getPresignedUrl メソッドを修正
async getPresignedUrl(
filename: string,
contentType: string
): Promise<{ url: string; key: string; documentId: string }> {
const bucketName = process.env.DOCUMENT_BUCKET_NAME || 'beacon-documents';
return this.coreDocumentService.getPresignedUrl(
bucketName,
getReviewDocumentKey,
filename,
contentType
);
}

// deleteS3File メソッドを修正
async deleteS3File(s3Key: string): Promise<boolean> {
const bucketName = process.env.DOCUMENT_BUCKET_NAME || 'beacon-documents';
return this.coreDocumentService.deleteS3File(bucketName, s3Key);
}

// 他のメソッドは変更なし
}

### チェックリスト作成のバックエンド修正

• **修正**: /src/api/features/checklist/services/checklist-set-service.ts
• 新しい CoreDocumentService を使用するように修正
• ドキュメント処理部分を共通化

## フロントエンド側の修正

### 1. 共通フックの作成

#### 1.1 useDocumentUpload フック

• **新規作成**: /src/hooks/useDocumentUpload.ts
typescript
import { useState } from 'react';
import { useFetch } from './useFetch'; // 既存の useFetch を使用

export function useDocumentUpload(options: {
apiEndpoint: string;
deleteEndpoint: string;
onUploadSuccess?: (data: { documentId: string, key: string, filename: string, fileType: string }) => void;
onUploadError?: (error: Error) => void;
onDeleteSuccess?: (key: string) => void;
onDeleteError?: (error: Error) => void;
}) {
const [uploadedFiles, setUploadedFiles] = useState<Array<{
documentId: string;
key: string;
filename: string;
fileType: string;
uploading: boolean;
}>>([]);
const [isUploading, setIsUploading] = useState(false);
const { fetchData } = useFetch();

// ファイルアップロード処理
const uploadFile = async (file: File) => {
setIsUploading(true);
try {
// 1. Pre-signed URL の取得
const presignedResponse = await fetchData(options.apiEndpoint, {
method: 'POST',
body: JSON.stringify({
filename: file.name,
contentType: file.type
})
});

      const { url, key, documentId } = presignedResponse.data;

      // 2. S3へのアップロード
      const newFile = {
        documentId,
        key,
        filename: file.name,
        fileType: file.type,
        uploading: true
      };

      setUploadedFiles(prev => [...prev, newFile]);

      // S3へのアップロードはfetchを使用
      await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      // 3. アップロード完了状態に更新
      setUploadedFiles(prev =>
        prev.map(f => f.key === key ? { ...f, uploading: false } : f)
      );

      // 4. 成功コールバック
      if (options.onUploadSuccess) {
        options.onUploadSuccess({
          documentId,
          key,
          filename: file.name,
          fileType: file.type
        });
      }
    } catch (error) {
      if (options.onUploadError && error instanceof Error) {
        options.onUploadError(error);
      }
    } finally {
      setIsUploading(false);
    }

};

// ファイル削除処理
const deleteFile = async (key: string) => {
try {
await fetchData(`${options.deleteEndpoint}${encodeURIComponent(key)}`, {
method: 'DELETE'
});

      // 削除したファイルを状態から除外
      setUploadedFiles(prev => prev.filter(f => f.key !== key));

      // 成功コールバック
      if (options.onDeleteSuccess) {
        options.onDeleteSuccess(key);
      }
    } catch (error) {
      if (options.onDeleteError && error instanceof Error) {
        options.onDeleteError(error);
      }
    }

};

return {
uploadedFiles,
isUploading,
uploadFile,
deleteFile
};
}

### 2. 審査作成コンポーネントの修正

#### 2.1 既存の審査作成コンポーネントの修正

• **修正**: /src/features/review/components/ReviewCreationForm.tsx (既存のコンポーネントを想定)

typescript
// 既存のコンポーネントに以下の変更を加える
import { useDocumentUpload } from '../../../hooks/useDocumentUpload';

export const ReviewCreationForm: React.FC = () => {
// 既存の状態管理
const [name, setName] = useState('');
const [checkListSetId, setCheckListSetId] = useState('');
// 新しいドキュメント状態
const [document, setDocument] = useState<{
documentId: string;
filename: string;
s3Key: string;
fileType: string;
} | null>(null);

// 他の既存の状態管理

// useDocumentUpload フックを使用
const { uploadedFiles, isUploading, uploadFile, deleteFile } = useDocumentUpload({
apiEndpoint: '/api/review/documents/presigned-url',
deleteEndpoint: '/api/review/documents/',
onUploadSuccess: (data) => {
setDocument({
documentId: data.documentId,
filename: data.filename,
s3Key: data.key,
fileType: data.fileType
});
},
onDeleteSuccess: () => {
setDocument(null);
}
});

// 既存の submit ハンドラを修正
const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();

    // バリデーション
    if (!name || !checkListSetId || !document) {
      // エラー処理
      return;
    }

    setIsSubmitting(true);

    try {
      // 既存のAPIエンドポイントを使用し、追加のパラメータを渡す
      const response = await fetchData('/api/review/jobs', {
        method: 'POST',
        body: JSON.stringify({
          name,
          documentId: document.documentId,
          checkListSetId,
          // 追加のパラメータ
          filename: document.filename,
          s3Key: document.s3Key,
          fileType: document.fileType
        })
      });

      // 成功時の処理（リダイレクトなど）
      window.location.href = `/reviews/${response.data.review_job_id}`;
    } catch (error) {
      // エラー処理
    } finally {
      setIsSubmitting(false);
    }

};

// 既存のレンダリング部分を修正
return (

<form onSubmit={handleSubmit}>
{/_ 既存のフォーム要素 _/}

      {/* ドキュメントアップロード部分を追加 */}
      <div className="form-group">
        <label>ドキュメント *</label>
        <div className="document-uploader">
          {/* ファイルアップロードUI */}
          <div className="dropzone" onClick={() => document ? null : document.getElementById('file-input')?.click()}>
            <input
              id="file-input"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
              }}
            />
            {isUploading ? (
              <p>アップロード中...</p>
            ) : document ? (
              <div className="uploaded-file">
                <span>{document.filename}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(document.s3Key);
                  }}
                >
                  削除
                </button>
              </div>
            ) : (
              <p>クリックしてファイルを選択</p>
            )}
          </div>
        </div>
      </div>

      {/* 既存のボタンなど */}
    </form>

);
};

### チェックリスト作成コンポーネントの修正

• **修正**: /src/features/checklist/components/ChecklistCreationForm.tsx
• 新しい useDocumentUpload フックを使用するように修正
• 既存のアップロード処理を共通フックに置き換え
• コードの重複を削減

# ドキュメントアップロード機能のリファクタリング

## 目的

- チェックリスト新規作成と審査作成機能で共通のドキュメントアップロード処理を実装する
- コードの重複を減らし、保守性を向上させる

## 修正内容

### バックエンド

1. ID 生成ユーティリティの共通化

   - `/src/api/features/checklist/utils/id-generator.ts` を `/src/api/core/utils/id-generator.ts` に移動

2. ドキュメント処理の共通化

   - `/src/api/core/document/document-service.ts` を新規作成
   - S3 関連の操作（pre-signed URL 生成、ファイル削除）を共通化

3. 審査ジョブ関連の修正
   - `ReviewJobRepository.createReviewJob` メソッドを拡張し、ドキュメント作成も同時に行えるようにする
   - `ReviewJobService.createReviewJob` メソッドを拡張し、ドキュメントアップロード情報も処理できるようにする
   - `ReviewDocumentService` を修正し、共通の `CoreDocumentService` を使用するようにする

### フロントエンド

1. ドキュメントアップロード処理の共通化

   - `/src/hooks/useDocumentUpload.ts` フックを新規作成
   - S3 へのアップロード処理を共通化

2. 審査作成コンポーネントの修正
   - 既存の審査作成フォームにドキュメントアップロード機能を追加
   - チェックリスト新規作成と同様の操作性を実現
3. チェックリスト作成コンポーネントの修正
   - 共通コンポーネント利用

## 実装方針

- 既存の API エンドポイントを活用し、不必要な新規作成を避ける
- 既存のコードを拡張する形で対応し、互換性を保つ
- 共通部分を抽出してコアモジュールに移動する

## 注意点

- 既存の機能を壊さないように注意する
- 適切なエラーハンドリングを実装する
- ユーザー体験を向上させる

# 修正計画のまとめ

## 削除するファイル

1. /src/api/features/checklist/utils/id-generator.ts
   • 内容を /src/api/core/utils/id-generator.ts に移動

## 新規作成するファイル

1. /src/api/core/utils/id-generator.ts
   • ID 生成ユーティリティの共通化
2. /src/api/core/document/document-service.ts
   • ドキュメント処理の共通化
3. /src/hooks/useDocumentUpload.ts
   • ドキュメントアップロード処理の共通化
4. /tasks/document-upload-refactor.md
   • リファクタリング計画の文書化

## 修正するファイル

### バックエンド

1. /src/api/features/review/repositories/review-job-repository.ts
   • createReviewJob メソッドを拡張
2. /src/api/features/review/services/review-job-service.ts
   • createReviewJob メソッドを拡張
3. /src/api/features/review/services/review-document-service.ts
   • CoreDocumentService を使用するように修正
4. /src/api/features/checklist/services/checklist-set-service.ts
   • CoreDocumentService を使用するように修正

### フロントエンド

1. /src/features/review/components/ReviewCreationForm.tsx
   • useDocumentUpload フックを使用するように修正
   • ドキュメントアップロード機能を追加
2. /src/features/checklist/components/ChecklistCreationForm.tsx

この計画では、既存の API エンドポイントとメソッドを拡張し、新しい機能を追加する形で対応します。不必要な新規作成を避け、既存のコードを最大限に活用します。
