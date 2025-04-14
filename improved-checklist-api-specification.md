# BEACON チェックリスト API 仕様書（改訂版）

## 概要

BEACON（Building & Engineering Approval Compliance Navigator）のチェックリスト機能に関する API 仕様書です。この API は、不動産業界向けの AI ドキュメント適合性チェックシステムにおいて、チェックリストの管理、ドキュメントのアップロード、および処理を行うためのエンドポイントを提供します。

## 認証

API リクエストには適切な認証が必要です。認証方法は別途定義されています。

## エンドポイント一覧

### チェックリストセット管理

1. [チェックリストセット一覧の取得](#チェックリストセット一覧の取得)
2. [チェックリストセット詳細の取得](#チェックリストセット詳細の取得)
3. [チェックリストセットの作成](#チェックリストセットの作成)
4. [チェックリストセットの更新](#チェックリストセットの更新)
5. [チェックリストセットの削除](#チェックリストセットの削除)

### チェックリスト項目管理

6. [チェックリスト項目詳細の取得](#チェックリスト項目詳細の取得)
7. [チェックリスト項目の階層構造取得](#チェックリスト項目の階層構造取得)
8. [チェックリスト項目の作成](#チェックリスト項目の作成)
9. [チェックリスト項目の更新](#チェックリスト項目の更新)
10. [チェックリスト項目の削除](#チェックリスト項目の削除)

### ドキュメント管理

11. [ドキュメントアップロード用 Presigned URL の取得](#ドキュメントアップロード用presigned-urlの取得)
12. [ドキュメント処理の開始](#ドキュメント処理の開始)

---

## チェックリストセット管理

### チェックリストセット一覧の取得

チェックリストセットの一覧を取得します。

**エンドポイント**

```
GET /checklist-sets
```

**クエリパラメータ**

| パラメータ | 型     | 必須   | 説明                                   |
| ---------- | ------ | ------ | -------------------------------------- |
| page       | number | いいえ | ページ番号（デフォルト: 1）            |
| limit      | number | いいえ | 1 ページあたりの件数（デフォルト: 10） |
| sortBy     | string | いいえ | ソート項目                             |
| sortOrder  | string | いいえ | ソート順序（'asc'または'desc'）        |

**レスポンス**

```json
{
  "success": true,
  "data": {
    "checkListSets": [
      {
        "check_list_set_id": "01HXYZ123ABC456DEF789GHIJK",
        "name": "不動産売買契約書チェックリスト",
        "description": "不動産売買契約書の適合性チェック用リスト",
        "processing_status": "in_progress"
      },
      {
        "check_list_set_id": "01HXYZ123ABC456DEF789GHIJL",
        "name": "賃貸契約書チェックリスト",
        "description": "賃貸契約書の適合性チェック用リスト",
        "processing_status": "completed"
      }
    ],
    "total": 2
  }
}
```

**実装上の注意**

- processing_status は DB に保存せず、アプリ側で動的に計算します
- 計算ロジック: すべてのドキュメントの status が completed の場合は completed、一つでも processing があれば in_progress、すべて pending なら pending

### チェックリストセット詳細の取得

指定された ID のチェックリストセットの詳細と関連するチェックリスト項目を取得します。

**エンドポイント**

```
GET /checklist-sets/:id
```

**パスパラメータ**

| パラメータ | 型     | 必須 | 説明                    |
| ---------- | ------ | ---- | ----------------------- |
| id         | string | はい | チェックリストセット ID |

**レスポンス**

```json
{
  "success": true,
  "data": {
    "check_list_set_id": "01HXYZ123ABC456DEF789GHIJK",
    "name": "不動産売買契約書チェックリスト",
    "description": "不動産売買契約書の適合性チェック用リスト",
    "checkListItems": [
      {
        "check_id": "01HXYZ123ABC456DEF789GHIJN",
        "name": "契約者情報の確認",
        "description": "契約者の氏名、住所、連絡先が正確に記載されているか",
        "parent_id": null,
        "item_type": "simple",
        "is_conclusion": false,
        "document_id": "01HXYZ123ABC456DEF789GHIJX"
      },
      {
        "check_id": "01HXYZ123ABC456DEF789GHIJO",
        "name": "物件情報の確認",
        "description": "物件の所在地、面積、構造等が正確に記載されているか",
        "parent_id": null,
        "item_type": "flow",
        "is_conclusion": false,
        "flow_data": {
          "condition_type": "YES_NO",
          "next_if_yes": "01HXYZ123ABC456DEF789GHIJP",
          "next_if_no": "01HXYZ123ABC456DEF789GHIJQ"
        },
        "document_id": "01HXYZ123ABC456DEF789GHIJY"
      }
    ]
  }
}
```

### チェックリストセットの作成

新しいチェックリストセットを作成します。

**エンドポイント**

```
POST /checklist-sets
```

**リクエストボディ**

```json
{
  "name": "建築確認申請書チェックリスト",
  "description": "建築確認申請書の適合性チェック用リスト",
  "documents": [
    {
      "documentId": "01HXYZ123ABC456DEF789GHIJV",
      "filename": "contract.pdf",
      "s3Key": "documents/original/01HXYZ123ABC456DEF789GHIJV/contract.pdf",
      "fileType": "application/pdf"
    }
  ]
}
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "check_list_set_id": "01HXYZ123ABC456DEF789GHIJM",
    "name": "建築確認申請書チェックリスト",
    "description": "建築確認申請書の適合性チェック用リスト",
    "processing_status": "pending"
  }
}
```

**実装上の注意**

- チェックリストセット作成時に、指定されたドキュメント情報に基づいてドキュメントレコードを作成します
- documentId は、事前に /documents/presigned-url エンドポイントで取得したドキュメント ID です
- S3 にファイルがアップロード済みであることを前提としています
- 複数のモデルを作成する操作となるため、Prisma の`$transaction`を使用して一つのトランザクションで実行してください

### チェックリストセットの更新

指定された ID のチェックリストセットを更新します。

**エンドポイント**

```

PUT /checklist-sets/:id

```

**パスパラメータ**

| パラメータ | 型     | 必須 | 説明                    |
| ---------- | ------ | ---- | ----------------------- |
| id         | string | はい | チェックリストセット ID |

**リクエストボディ**

```json
{
  "name": "更新された建築確認申請書チェックリスト",
  "description": "更新された説明文"
}
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "check_list_set_id": "01HXYZ123ABC456DEF789GHIJM",
    "name": "更新された建築確認申請書チェックリスト",
    "description": "更新された説明文",
    "processing_status": "pending"
  }
}
```

### チェックリストセットの削除

指定された ID のチェックリストセットを削除します。

**エンドポイント**

```
DELETE /checklist-sets/:id
```

**パスパラメータ**

| パラメータ | 型     | 必須 | 説明                    |
| ---------- | ------ | ---- | ----------------------- |
| id         | string | はい | チェックリストセット ID |

**レスポンス**

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

## チェックリスト項目管理

### チェックリスト項目詳細の取得

指定されたチェックリストセットに属する特定のチェックリスト項目の詳細を取得します。

**エンドポイント**

```
GET /checklist-sets/:setId/items/:itemId
```

**パスパラメータ**

| パラメータ | 型     | 必須 | 説明                    |
| ---------- | ------ | ---- | ----------------------- |
| setId      | string | はい | チェックリストセット ID |
| itemId     | string | はい | チェックリスト項目 ID   |

**レスポンス**

```json
{
  "success": true,
  "data": {
    "check_id": "01HXYZ123ABC456DEF789GHIJO",
    "name": "物件情報の確認",
    "description": "物件の所在地、面積、構造等が正確に記載されているか",
    "parent_id": null,
    "item_type": "flow",
    "is_conclusion": false,
    "flow_data": {
      "condition_type": "YES_NO",
      "next_if_yes": "01HXYZ123ABC456DEF789GHIJP",
      "next_if_no": "01HXYZ123ABC456DEF789GHIJQ"
    },
    "check_list_set_id": "01HXYZ123ABC456DEF789GHIJK",
    "document_id": "01HXYZ123ABC456DEF789GHIJY",
    "document": {
      "document_id": "01HXYZ123ABC456DEF789GHIJY",
      "filename": "floor_plan.png",
      "s3_path": "documents/original/01HXYZ123ABC456DEF789GHIJY/floor_plan.png",
      "file_type": "png",
      "upload_date": "2025-04-14T05:17:30Z",
      "status": "processing"
    }
  }
}
```

### チェックリスト項目の階層構造取得

指定されたチェックリストセットに属する項目を階層構造で取得します。

**エンドポイント**

```
GET /checklist-sets/:setId/items/hierarchy
```

**パスパラメータ**

| パラメータ | 型     | 必須 | 説明                    |
| ---------- | ------ | ---- | ----------------------- |
| setId      | string | はい | チェックリストセット ID |

**レスポンス**

```json
{
  "success": true,
  "data": [
    {
      "check_id": "01HXYZ123ABC456DEF789GHIJN",
      "name": "契約者情報の確認",
      "description": "契約者の氏名、住所、連絡先が正確に記載されているか",
      "parent_id": null,
      "item_type": "simple",
      "is_conclusion": false,
      "check_list_set_id": "01HXYZ123ABC456DEF789GHIJK",
      "document_id": "01HXYZ123ABC456DEF789GHIJX",
      "children": []
    },
    {
      "check_id": "01HXYZ123ABC456DEF789GHIJO",
      "name": "物件情報の確認",
      "description": "物件の所在地、面積、構造等が正確に記載されているか",
      "parent_id": null,
      "item_type": "flow",
      "is_conclusion": false,
      "flow_data": {
        "condition_type": "YES_NO",
        "next_if_yes": "01HXYZ123ABC456DEF789GHIJP",
        "next_if_no": "01HXYZ123ABC456DEF789GHIJQ"
      },
      "check_list_set_id": "01HXYZ123ABC456DEF789GHIJK",
      "document_id": "01HXYZ123ABC456DEF789GHIJY",
      "children": [
        {
          "check_id": "01HXYZ123ABC456DEF789GHIJP",
          "name": "物件情報が正確",
          "description": "物件情報が正確に記載されている場合",
          "parent_id": "01HXYZ123ABC456DEF789GHIJO",
          "item_type": "simple",
          "is_conclusion": true,
          "check_list_set_id": "01HXYZ123ABC456DEF789GHIJK",
          "document_id": "01HXYZ123ABC456DEF789GHIJY",
          "children": []
        },
        {
          "check_id": "01HXYZ123ABC456DEF789GHIJQ",
          "name": "物件情報が不正確",
          "description": "物件情報が不正確な場合",
          "parent_id": "01HXYZ123ABC456DEF789GHIJO",
          "item_type": "simple",
          "is_conclusion": true,
          "check_list_set_id": "01HXYZ123ABC456DEF789GHIJK",
          "document_id": "01HXYZ123ABC456DEF789GHIJY",
          "children": []
        }
      ]
    }
  ]
}
```

### チェックリスト項目の作成

新しいチェックリスト項目を作成します。

**エンドポイント**

```
POST /checklist-sets/:setId/items
```

**パスパラメータ**

| パラメータ | 型     | 必須 | 説明                    |
| ---------- | ------ | ---- | ----------------------- |
| setId      | string | はい | チェックリストセット ID |

**リクエストボディ**

```json
{
  "name": "契約金額の確認",
  "description": "契約金額が正確に記載されているか",
  "parentId": null,
  "itemType": "simple",
  "isConclusion": false,
  "documentId": "01HXYZ123ABC456DEF789GHIJX"
}
```

**フロー型項目の場合のリクエスト例**

```json
{
  "name": "契約条件の確認",
  "description": "契約条件が適切に記載されているか",
  "parentId": null,
  "itemType": "flow",
  "isConclusion": false,
  "flowData": {
    "condition_type": "YES_NO",
    "next_if_yes": "01HXYZ123ABC456DEF789GHIJR",
    "next_if_no": "01HXYZ123ABC456DEF789GHIJS"
  },
  "documentId": "01HXYZ123ABC456DEF789GHIJX"
}
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "check_id": "01HXYZ123ABC456DEF789GHIJT",
    "name": "契約金額の確認",
    "description": "契約金額が正確に記載されているか",
    "parent_id": null,
    "item_type": "simple",
    "is_conclusion": false,
    "check_list_set_id": "01HXYZ123ABC456DEF789GHIJK",
    "document_id": "01HXYZ123ABC456DEF789GHIJX"
  }
}
```

**実装上の注意**

- チェックリスト項目作成時に、指定された documentId が当該チェックリストセットに属していることを検証するロジックを追加してください
- 親子関係のあるチェックリスト項目は同じドキュメントに紐づけるというルールを適用してください
- parentId が指定されている場合は、親項目の documentId と同じであることを検証してください

```

### チェックリスト項目の更新

指定されたチェックリストセットに属する特定のチェックリスト項目を更新します。

**エンドポイント**

```

PUT /checklist-sets/:setId/items/:itemId

````

**パスパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|----------|------|------|------|
| setId | string | はい | チェックリストセットID |
| itemId | string | はい | チェックリスト項目ID |

**リクエストボディ**

```json
{
  "name": "更新された契約金額の確認",
  "description": "更新された説明文",
  "isConclusion": true,
  "documentId": "01HXYZ123ABC456DEF789GHIJZ"
}
````

**レスポンス**

```json
{
  "success": true,
  "data": {
    "check_id": "01HXYZ123ABC456DEF789GHIJT",
    "name": "更新された契約金額の確認",
    "description": "更新された説明文",
    "parent_id": null,
    "item_type": "simple",
    "is_conclusion": true,
    "check_list_set_id": "01HXYZ123ABC456DEF789GHIJK",
    "document_id": "01HXYZ123ABC456DEF789GHIJZ"
  }
}
```

### チェックリスト項目の削除

指定されたチェックリストセットに属する特定のチェックリスト項目を削除します。

**エンドポイント**

```
DELETE /checklist-sets/:setId/items/:itemId
```

**パスパラメータ**

| パラメータ | 型     | 必須 | 説明                    |
| ---------- | ------ | ---- | ----------------------- |
| setId      | string | はい | チェックリストセット ID |
| itemId     | string | はい | チェックリスト項目 ID   |

**レスポンス**

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

## ドキュメント管理

### ドキュメントアップロード用 Presigned URL の取得

ドキュメントをアップロードするための Presigned URL を取得します。

**エンドポイント**

```
POST /documents/presigned-url
```

**リクエストボディ**

```json
{
  "filename": "contract.pdf",
  "contentType": "application/pdf"
}
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "url": "https://document-bucket.s3.ap-northeast-1.amazonaws.com/documents/original/01HXYZ123ABC456DEF789GHIJX/contract.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
    "key": "documents/original/01HXYZ123ABC456DEF789GHIJX/contract.pdf",
    "documentId": "01HXYZ123ABC456DEF789GHIJX"
  }
}
```

**実装上の注意**

- Presigned URL 取得時にドキュメント ID を生成し、クライアントに返します
- クライアントはこの URL を使用して S3 に直接ファイルをアップロードします
- アップロード完了後、クライアントはこのドキュメント ID をチェックリストセット作成時に使用します
- ドキュメントレコードはチェックリストセット作成時に作成されます（この時点で S3 にファイルが存在していることを前提とします）

```

### ドキュメント処理の開始

アップロードされたドキュメントの処理を開始します。

**エンドポイント**

```

POST /documents/:id/start-processing

````

**パスパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|----------|------|------|------|
| id | string | はい | ドキュメントID |

**リクエストボディ**

```json
{
  "fileName": "contract.pdf"
}
````

**レスポンス**

```json
{
  "success": true,
  "data": {
    "started": true,
    "document": {
      "document_id": "01HXYZ123ABC456DEF789GHIJX",
      "filename": "contract.pdf",
      "status": "processing"
    }
  }
}
```

**実装上の注意**

- ドキュメント処理の開始前に、ドキュメントがすでにチェックリストセットに関連付けられていることを確認してください
- ドキュメント処理の結果は、CheckResult モデルを使用してチェックリスト項目と関連付けられます（具体的なフローは TBD）
- ドキュメント処理状態の変更に伴い、チェックリストセットの処理状態も更新する必要があります
- 処理状態の計算ロジック: すべてのドキュメントの status が completed の場合は completed、一つでも processing があれば in_progress、すべて pending なら pending

## ステータスコード

| コード | 説明                   |
| ------ | ---------------------- |
| 200    | 成功                   |
| 201    | 作成成功               |
| 400    | 不正なリクエスト       |
| 401    | 認証エラー             |
| 403    | 権限エラー             |
| 404    | リソースが見つからない |
| 500    | サーバーエラー         |

## エラーレスポンス

エラーが発生した場合、以下の形式でレスポンスが返されます。

```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```
