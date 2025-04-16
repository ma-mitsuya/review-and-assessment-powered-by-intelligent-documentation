# チェックリスト抽出要件定義書

## 概要

- SFn で実施

  - 定義：cdk/lib/constructs/document-page-processor.ts
  - 上記定義の変更は厳禁

- あなたが実装すべきもの：backend/src/checklist-workflow の各処理
- 各処理は backend/src/checklist-workflow/index.ts のエントリポイントによって振り分け
- backend/src/checklist-workflow/document-processing のファイル構成にしたがうこと
  - types, index.ts, etc
- class は利用禁止、関数のみ（関数「型」プログラミングではない点に留意）
- 処理は PDF ファイルのみ対象。将来的に拡張する予定あり
  - 一番最初の processDocument に拡張子判別を入れ、サポート外は exception throw で OK
- 各処理は backend/src/checklist-workflow/common/storage-paths.ts に従い S3 に入出力すること

## 処理ごとの概要

- handleProcessDocument
  - ファイル判定、pdf 以外はエラー
  - pdf をページに分割
    - pdf-lib 利用
  - 分割して S3 保存
- handleExtractText
  - library 利用して PDF テキストを抽出が本来の目的だが、今回は空文字列を S3 へ保存（Extract はしない、実質無処理）
- handleProcessWithLLM
  - Bedrock Converse API 利用し、Sonnet 3.7 with extended thinking で、そのページのチェックリストを抽出する
  - 結果が JSON parse 不可能であれば、「なぜパースできなかったか」の例外メッセージを Bedrock に食わせてリトライ
  - プロンプトは下記参考
  - この JSON 構造はのちに RDB へ格納される。backend/prisma/schema.prisma 参考
  - 後に　 combine できるように処理。具体的には：
    - LLM が出力した parent_id を数値から ulid に置換する
- handleCombinePageResults
  - ExtractText の結果と、ProcessWithLLM の結果を統合する
  - 今回 ExtractText はしないので、ProcessWithLLM の結果をそのまま別の S3 キーへ保存するだけの処理
- handleAggregatePageResults
  - これまで分割処理した各ページの結果を、一つに統合する
  - 単に各 JSON を結合するだけの処理
  - 結合後のフォーマットを考え、それをどのように prisma のスキーマにマッピングするかも合わせて考慮

## prompt

```ts
export const CHECKLIST_EXTRACTION_PROMPT = `
あなたは技術文書、法律文書、表や図面から「チェックリスト」を抽出して構造化するAIアシスタントです。

## 概要
非構造化データから、チェックリスト項目を抽出し、階層構造やフローチャート型の判断フローも含めて構造化してください。

## 出力形式
厳密なJSON配列形式で出力してください。マークダウンの記法（\`\`\`json など）は使用せず、純粋なJSON配列のみを返してください。

重要: 必ず配列形式（[ ]で囲まれた形式）で出力してください。オブジェクト（{ }）ではなく配列を返してください。

各チェックリスト項目は以下のフィールドを含みます：

- name: チェック項目の名前
- description: チェック内容の詳細説明
- parent_id: 親項目の番号（最上位項目はnull）
- item_type: "SIMPLE"（単純なチェック項目）または"FLOW"（フローチャート型項目）
- is_conclusion: 結論項目かどうか（boolean）
- flow_data: フローチャート型項目の場合のみ設定（JSON object）
  * condition_type: "YES_NO"または"MULTI_CHOICE"
  * next_if_yes: "YES"の場合の次項目番号（YES/NO形式の場合）
  * next_if_no: "NO"の場合の次項目番号（YES/NO形式の場合）
  * next_options: 複数選択肢の場合の選択肢と次項目のマッピング

## 抽出ルール
1. 単純なチェック項目とフローチャート型項目を識別してください
2. 階層構造は親子関係で表現してください（parent_id）
3. フローチャート型項目では条件分岐を明確にしてください
4. 法的参照情報がある場合は description に含めてください
5. すべてのチェック項目を漏れなく抽出してください
6. 重複は排除し、整理してください
7. parent_id は数値で表現してください（0開始、最上位項目はnull）

## 例：正しい出力形式（配列）
[
  {
    "name": "契約当事者の記載",
    "description": "契約書に両当事者の正式名称が正確に記載されているか",
    "parent_id": 0,
    "item_type": "SIMPLE",
    "is_conclusion": false,
    "flow_data": null
  },
  {
    "name": "特定された資産があるか",
    "description": "特定された資産があるか、当該判断においては、サプライヤーが使用期間全体を通じて資産を代替する実質上の能力を有するか考慮する",
    "parent_id": null,
    "item_type": "FLOW",
    "is_conclusion": false,
    "flow_data": {
      "condition_type": "YES_NO",
      "next_if_yes": 2,
      "next_if_no": 10
    }
  }
]

## 注意事項
- 文書から抽出可能なすべての情報を含めてください
- 階層構造とフロー構造を正確に反映させてください
- 関連する法的参照があれば必ず含めてください
- 出力は厳密なJSON配列のみとし、説明文やマークダウン記法（\`\`\`json のようなコードブロック）は含めないでください
- フローチャート構造が存在する場合は特に注意して抽出してください
- 入力された文書の言語と同じ言語で出力してください
- parent_id は必ず数値（または最上位項目の場合はnull）で表現してください
- 必ず配列形式で出力してください。オブジェクトではなく配列を返してください

入力された文書から上記の形式でチェックリストを抽出し、JSON配列として返してください。
`;
```
