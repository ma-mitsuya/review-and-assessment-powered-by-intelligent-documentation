# BEACON 審査 API 仕様書（更新版）

## 概要

BEACON（Building & Engineering Approval Compliance Navigator）の審査機能に関する API 仕様書です。この API は、不動産業界向けの AI ドキュメント適合性チェックシステムにおいて、審査ジョブの管理、ドキュメントとチェックリストの突き合わせ、および審査結果の取得を行うためのエンドポイントを提供します。

## 認証

API リクエストには適切な認証が必要です。認証方法は別途定義されています。

## エンドポイント一覧

### 審査ジョブ管理

1. [審査ジョブ一覧の取得](#審査ジョブ一覧の取得)
2. [審査ジョブの作成](#審査ジョブの作成)
3. [審査ジョブの削除](#審査ジョブの削除)

### 審査結果管理

4. [審査結果の階層構造取得](#審査結果の階層構造取得)
5. [審査結果の更新（ユーザー上書き）](#審査結果の更新ユーザー上書き)

---

## 審査ジョブ管理

### 審査ジョブ一覧の取得

審査ジョブの一覧を取得します。

**エンドポイント**

```
GET /review-jobs
```

**クエリパラメータ**

| パラメータ | 型     | 必須   | 説明                                   |
| ---------- | ------ | ------ | -------------------------------------- |
| page       | number | いいえ | ページ番号（デフォルト: 1）            |
| limit      | number | いいえ | 1 ページあたりの件数（デフォルト: 10） |
| sortBy     | string | いいえ | ソート項目（例: createdAt）            |
| sortOrder  | string | いいえ | ソート順序（'asc'または'desc'）        |
| status     | string | いいえ | ステータスでフィルタリング             |

**レスポンス**

```json
{
  "success": true,
  "data": {
    "reviewJobs": [
      {
        "review_job_id": "01HXYZ123ABC456DEF789GHIJK",
        "name": "不動産売買契約書審査",
        "status": "completed",
        "document": {
          "document_id": "01HXYZ123ABC456DEF789GHIJX",
          "filename": "売買契約書_20250401.pdf"
        },
        "check_list_set": {
          "check_list_set_id": "01HXYZ123ABC456DEF789GHIJM",
          "name": "不動産売買契約書チェックリスト"
        },
        "created_at": "2025-04-10T09:00:00Z",
        "updated_at": "2025-04-10T09:15:00Z",
        "completed_at": "2025-04-10T09:15:00Z",
        "summary": {
          "total": 15,
          "passed": 12,
          "failed": 3
        }
      },
      {
        "review_job_id": "01HXYZ123ABC456DEF789GHIJL",
        "name": "賃貸契約書審査",
        "status": "processing",
        "document": {
          "document_id": "01HXYZ123ABC456DEF789GHIJY",
          "filename": "賃貸契約書_20250412.pdf"
        },
        "check_list_set": {
          "check_list_set_id": "01HXYZ123ABC456DEF789GHIJN",
          "name": "賃貸契約書チェックリスト"
        },
        "created_at": "2025-04-12T14:30:00Z",
        "updated_at": "2025-04-12T14:30:00Z",
        "completed_at": null,
        "summary": {
          "total": 12,
          "passed": 5,
          "failed": 1,
          "processing": 6
        }
      }
    ],
    "total": 2
  }
}
```

**実装上の注意**

- summary は DB に保存せず、アプリ側で動的に計算します
- 計算ロジック: 関連する ReviewResult の結果を集計して算出します
- 結果は pass/fail のみとし、warning は使用しません

### 審査ジョブの作成

新しい審査ジョブを作成します。

**エンドポイント**

```
POST /review-jobs
```

**リクエストボディ**

```json
{
  "name": "建築確認申請書審査",
  "documentId": "01HXYZ123ABC456DEF789GHIJZ",
  "checkListSetId": "01HXYZ123ABC456DEF789GHIJO"
}
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "review_job_id": "01HXYZ123ABC456DEF789GHIJP",
    "name": "建築確認申請書審査",
    "status": "pending",
    "document": {
      "document_id": "01HXYZ123ABC456DEF789GHIJZ",
      "filename": "建築確認申請書_20250414.pdf"
    },
    "check_list_set": {
      "check_list_set_id": "01HXYZ123ABC456DEF789GHIJO",
      "name": "建築確認申請書チェックリスト"
    },
    "created_at": "2025-04-14T15:30:00Z",
    "updated_at": "2025-04-14T15:30:00Z",
    "completed_at": null
  }
}
```

**実装上の注意**

- 審査ジョブ作成時に、指定されたドキュメントとチェックリストセットが存在することを検証します
- 審査ジョブ作成後、非同期でチェック項目ごとの審査処理を開始します
- 各チェック項目に対して ReviewResult レコードを作成し、初期状態は pending とします
- 処理は AWS Step Functions などを使用して非同期で実行します

### 審査ジョブの削除

指定された ID の審査ジョブを削除します。

**エンドポイント**

```
DELETE /review-jobs/:id
```

**パスパラメータ**

| パラメータ | 型     | 必須 | 説明          |
| ---------- | ------ | ---- | ------------- |
| id         | string | はい | 審査ジョブ ID |

**レスポンス**

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

**実装上の注意**

- 審査ジョブを削除すると、関連する審査結果も全て削除されます
- 処理中の審査ジョブを削除する場合は、バックグラウンドジョブもキャンセルします

---

## 審査結果管理

### 審査結果の階層構造取得

指定された審査ジョブの審査結果を階層構造で取得します。

**エンドポイント**

```
GET /review-jobs/:jobId/results/hierarchy
```

**パスパラメータ**

| パラメータ | 型     | 必須 | 説明          |
| ---------- | ------ | ---- | ------------- |
| jobId      | string | はい | 審査ジョブ ID |

**レスポンス**

```json
{
  "success": true,
  "data": [
    {
      "review_result_id": "01HXYZ123ABC456DEF789GHIJQ",
      "check_id": "01HXYZ123ABC456DEF789GHIJR",
      "status": "completed",
      "result": "pass",
      "confidence_score": 0.95,
      "explanation": "契約者の氏名、住所、連絡先が正確に記載されています。",
      "extracted_text": "契約者：山田太郎\n住所：東京都千代田区...",
      "user_override": false,
      "user_comment": null,
      "check_list": {
        "check_id": "01HXYZ123ABC456DEF789GHIJR",
        "name": "契約者情報の確認",
        "description": "契約者の氏名、住所、連絡先が正確に記載されているか",
        "parent_id": null,
        "item_type": "simple"
      },
      "children": []
    },
    {
      "review_result_id": "01HXYZ123ABC456DEF789GHIJS",
      "check_id": "01HXYZ123ABC456DEF789GHIJT",
      "status": "completed",
      "result": "fail",
      "confidence_score": 0.87,
      "explanation": "物件の所在地が不明確です。住居表示と地番が一致していません。",
      "extracted_text": "物件所在地：東京都新宿区...",
      "user_override": false,
      "user_comment": null,
      "check_list": {
        "check_id": "01HXYZ123ABC456DEF789GHIJT",
        "name": "物件情報の確認",
        "description": "物件の所在地、面積、構造等が正確に記載されているか",
        "parent_id": null,
        "item_type": "flow",
        "flow_data": {
          "condition_type": "YES_NO",
          "next_if_yes": "01HXYZ123ABC456DEF789GHIJU",
          "next_if_no": "01HXYZ123ABC456DEF789GHIJV"
        }
      },
      "children": [
        {
          "review_result_id": "01HXYZ123ABC456DEF789GHIJW",
          "check_id": "01HXYZ123ABC456DEF789GHIJU",
          "status": "completed",
          "result": "pass",
          "confidence_score": 0.92,
          "explanation": "物件情報が正確に記載されています。",
          "extracted_text": "物件情報：...",
          "user_override": false,
          "user_comment": null,
          "check_list": {
            "check_id": "01HXYZ123ABC456DEF789GHIJU",
            "name": "物件情報が正確",
            "description": "物件情報が正確に記載されている場合",
            "parent_id": "01HXYZ123ABC456DEF789GHIJT",
            "item_type": "simple",
            "is_conclusion": true
          },
          "children": []
        }
      ]
    }
  ]
}
```

**実装上の注意**

- 階層構造は、チェックリスト項目の親子関係に基づいて構築します
- 各ノードには、そのノードの審査結果と子ノードの審査結果を含めます
- 親ノードの結果ステータスは、子ノードの結果に基づいて計算します（すべての子が pass なら pass、一つでも fail があれば fail）
- 信頼度スコアが閾値を下回る場合は、フロントエンド側で警告表示を行います

### 審査結果の更新（ユーザー上書き）

指定された審査結果をユーザーが上書きします。

**エンドポイント**

```
PUT /review-jobs/:jobId/results/:resultId
```

**パスパラメータ**

| パラメータ | 型     | 必須 | 説明          |
| ---------- | ------ | ---- | ------------- |
| jobId      | string | はい | 審査ジョブ ID |
| resultId   | string | はい | 審査結果 ID   |

**リクエストボディ**

```json
{
  "result": "pass",
  "userComment": "システムは失敗と判定しましたが、この場合は問題ありません。"
}
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "review_result_id": "01HXYZ123ABC456DEF789GHIJS",
    "review_job_id": "01HXYZ123ABC456DEF789GHIJK",
    "check_id": "01HXYZ123ABC456DEF789GHIJT",
    "status": "completed",
    "result": "pass",
    "confidence_score": 0.87,
    "explanation": "物件の所在地が不明確です。住居表示と地番が一致していません。",
    "user_override": true,
    "user_comment": "システムは失敗と判定しましたが、この場合は問題ありません。",
    "updated_at": "2025-04-10T10:30:00Z"
  }
}
```

**実装上の注意**

- ユーザーによる上書きの場合は、`user_override` フラグを true に設定します
- 上書き後、親ノードの結果ステータスを再計算する必要があります
- 審査ジョブのサマリー情報も更新する必要があります

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

## 信頼度スコアの扱い

- 信頼度スコアの閾値は `frontend/src/features/review/constants.ts` に定義します
- 閾値を下回る場合は、フロントエンド側で警告マークなどを表示します
- 閾値の例: `CONFIDENCE_THRESHOLD = 0.7`
