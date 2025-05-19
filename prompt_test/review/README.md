# RAPID 審査テストツール

このツールは、不動産書類の審査を行うためのテストツールです。Amazon Bedrock の Claude モデルを使用して、PDF ドキュメントがチェックリストの項目に適合しているかどうかを判断します。

## 使い方

### 基本的な使い方

```bash
# デフォルトのsample.pdfを使用する場合
npm run review

# 特定のPDFファイルを指定する場合
npm run review my-document.pdf

# 出力ディレクトリを指定する場合
npm run review my-document.pdf --output ./my-results
```

### ファイル配置

1. 審査対象の PDF ファイルは `test-documents` ディレクトリに配置してください
2. チェックリストは `checklists` ディレクトリに配置してください
   - PDF ファイル名と同じ名前の JSON ファイル（拡張子を除く）が使用されます
   - 例: `my-document.pdf` の場合、`checklists/my-document.json` が使用されます
   - 対応する JSON ファイルがない場合は、デフォルトの `sample.json` が使用されます

### チェックリストのフォーマット

チェックリスト JSON ファイルは以下の形式で作成してください：

```json
[
  {
    "id": "check-001",
    "name": "契約書に契約者の氏名が明記されていること",
    "description": "契約書には、契約者の氏名が正確に記載されている必要があります"
  },
  {
    "id": "check-002",
    "name": "物件情報が正確に記載されていること",
    "description": "物件の所在地、面積、構造などが明確に記載されている必要があります"
  }
]
```

## 結果

審査結果は `results` ディレクトリ（または指定した出力ディレクトリ）に保存されます。
結果ファイルは以下の形式で保存されます：

```
{ドキュメント名}_results_{タイムスタンプ}.json
```

## 注意事項

- 現在は PDF ファイルのみサポートしています
- AWS 認証情報が適切に設定されている必要があります
- AWS_REGION 環境変数が設定されていない場合、デフォルトで「us-west-2」が使用されます
