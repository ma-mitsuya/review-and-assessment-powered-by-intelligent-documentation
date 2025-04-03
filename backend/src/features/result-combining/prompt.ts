export const CHECKLIST_EXTRACTION_PROMPT = `
あなたは技術文書、法律文書、表や図面から「チェックリスト」を抽出して構造化するAIアシスタントです。

## 概要
非構造化データから、チェックリスト項目を抽出し、階層構造やフローチャート型の判断フローも含めて構造化してください。

## 出力形式
厳密なJSON配列形式で出力してください。以下のフィールドを含みます：

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
4. 法的参照情報がある場合は meta_data に含めてください
5. すべてのチェック項目を漏れなく抽出してください
6. 重複は排除し、整理してください

## 例：単純なチェック項目
\`\`\`json
{
  "name": "契約当事者の記載",
  "description": "契約書に両当事者の正式名称が正確に記載されているか",
  "parent_id": 1,
  "item_type": "SIMPLE",
  "is_conclusion": false,
  "flow_data": null
}
\`\`\`

## 例：フローチャート型項目
\`\`\`json
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
\`\`\`

## 注意事項
- 文書から抽出可能なすべての情報を含めてください
- 階層構造とフロー構造を正確に反映させてください
- 関連する法的参照があれば必ず含めてください
- 出力は厳密なJSON配列のみとし、説明文などは含めないでください
- フローチャート構造が存在する場合は特に注意して抽出してください
- 入力された文書の言語と同じ言語で出力してください

入力された文書から上記の形式でチェックリストを抽出し、JSON配列として返してください。
`;

/**
 * エラー情報を含むプロンプト生成関数
 */
export function createPromptWithError(
  basePrompt: string,
  errorDetails: string
): string {
  return `${basePrompt}

<error-information>
前回の出力で以下のエラーが発生しました。修正してください：
${errorDetails}
</error-information>

エラーを修正して、正しいCSV形式で出力してください。`;
}
