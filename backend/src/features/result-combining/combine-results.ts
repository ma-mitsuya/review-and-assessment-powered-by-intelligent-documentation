import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message,
} from "@aws-sdk/client-bedrock-runtime";
import { err, ok, Result, S3Utils } from "../../core/utils";
import {
  getPageCombinedKey,
  getPageExtractedTextKey,
  getPageLlmOcrTextKey,
} from "../common/storage-paths";
import { CombinedPageResult } from "./types";
import { CHECKLIST_PROMPT } from "./prompt";
import { modelId } from "../../core/bedrock/model-id";

/**
 * CSVの有効性をチェックする純粋関数
 * @param csv CSVデータ文字列
 * @returns 有効性の結果とメッセージ
 */
export function validateCsvFormat(csv: string): {
  isValid: boolean;
  message?: string;
} {
  if (!csv || csv.trim() === "") {
    return { isValid: false, message: "CSVが空です" };
  }

  const lines = csv.trim().split("\n");
  if (lines.length === 0) {
    return { isValid: false, message: "CSVに行がありません" };
  }

  const header = lines[0].trim();
  if (header !== "id,name,condition") {
    return { isValid: false, message: `ヘッダーが不正です: "${header}"` };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;

    // カンマで区切られた各フィールドを抽出（引用符内のカンマは考慮）
    const fields = extractCsvFields(line);

    if (fields.length !== 3) {
      return {
        isValid: false,
        message: `行 ${i + 1} のフィールド数が不正です: ${
          fields.length
        } (期待値: 3)`,
      };
    }

    const [id] = fields;
    // IDが数字とドットのみで構成されているか確認
    if (!/^[\d.]+$/.test(id)) {
      return {
        isValid: false,
        message: `行 ${i + 1} のidフィールドが不正です: "${id}"`,
      };
    }
  }

  return { isValid: true };
}

/**
 * CSVの行から正確にフィールドを抽出する関数（引用符内のカンマを考慮）
 */
export function extractCsvFields(line: string): string[] {
  const fields: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // 引用符をそのまま保持する
      currentField += char;
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(currentField);
      currentField = "";
    } else {
      currentField += char;
    }
  }

  // 最後のフィールドを追加
  fields.push(currentField);
  return fields;
}

/**
 * LLMに問い合わせてチェックリストを取得する純粋関数
 */
export async function generateChecklist(
  extractedText: string,
  llmOcrText: string,
  bedrock: BedrockRuntimeClient,
  modelId: modelId,
  inferenceConfig: any
): Promise<Result<string, Error>> {
  try {
    const messages: Message[] = [
      {
        role: "user",
        content: [
          { text: CHECKLIST_PROMPT },
          {
            text: `<extracted-text>\n${extractedText}\n</extracted-text>\n<llm-ocr>\n${llmOcrText}</llm-ocr>`,
          },
        ],
      },
    ];

    const response = await bedrock.send(
      new ConverseCommand({ modelId, messages, inferenceConfig })
    );

    const checklist = (response.output?.message?.content ?? [])
      .filter((c) => "text" in c)
      .map((c) => (c as { text: string }).text)
      .join("");

    return ok(checklist);
  } catch (e) {
    return err(e instanceof Error ? e : new Error("LLM呼び出し失敗"));
  }
}

/**
 * チェックリストの生成を最大リトライ回数まで試行する関数
 */
export async function generateValidChecklist(
  extractedText: string,
  llmOcrText: string,
  bedrock: BedrockRuntimeClient,
  modelIdValue: modelId,
  inferenceConfig: any,
  maxRetries: number = 2
): Promise<Result<string, Error>> {
  let attempts = 0;

  while (attempts <= maxRetries) {
    console.log(
      `[generateValidChecklist] 試行 ${attempts + 1}/${maxRetries + 1}`
    );

    const result = await generateChecklist(
      extractedText,
      llmOcrText,
      bedrock,
      modelIdValue,
      inferenceConfig
    );

    if (!result.ok) {
      console.error(
        `[generateValidChecklist] 生成に失敗: ${result.error.message}`
      );
      // 生成に失敗した場合もリトライする
      attempts++;
      if (attempts > maxRetries) {
        return err(
          new Error(
            `LLM生成に失敗しました。${
              maxRetries + 1
            }回試行しましたが全て失敗しました。最後のエラー: ${
              result.error.message
            }`
          )
        );
      }
      console.log(
        `[generateValidChecklist] リトライします (${attempts}/${maxRetries})`
      );
      continue;
    }

    const checklist = result.value;
    const validation = validateCsvFormat(checklist);

    if (validation.isValid) {
      console.log(`[generateValidChecklist] 有効なCSVを生成しました`);
      return ok(checklist);
    }

    console.warn(`[generateValidChecklist] 無効なCSV: ${validation.message}`);
    attempts++;
  }

  return err(
    new Error(
      `有効なCSVの生成に失敗しました。${
        maxRetries + 1
      }回試行しましたが全て失敗しました。`
    )
  );
}

export async function combinePageResults(
  params: {
    documentId: string;
    pageNumber: number;
  },
  deps: {
    s3: S3Utils;
    bedrock: BedrockRuntimeClient;
    modelId: modelId;
    inferenceConfig: {
      maxTokens: number;
      temperature: number;
      topP: number;
    };
  }
): Promise<Result<CombinedPageResult, Error>> {
  const { documentId, pageNumber } = params;
  const { s3, bedrock, modelId, inferenceConfig } = deps;

  console.log(
    `[combinePageResults] 開始: documentId=${documentId}, pageNumber=${pageNumber}, modelId=${modelId}`
  );

  // S3からデータ取得
  const textKey = getPageExtractedTextKey(documentId, pageNumber);
  const llmKey = getPageLlmOcrTextKey(documentId, pageNumber);

  console.log(
    `[combinePageResults] S3からデータ取得開始: textKey=${textKey}, llmKey=${llmKey}`
  );

  const [textRes, llmRes] = await Promise.all([
    s3.getObject(textKey),
    s3.getObject(llmKey),
  ]);

  if (!textRes.ok || !llmRes.ok) {
    const errorKey = !textRes.ok ? textKey : llmKey;
    const errorMessage = !textRes.ok
      ? textRes.error.message
      : llmRes.error.message;
    console.error(
      `[combinePageResults] S3からの読み込み失敗: ${errorKey} - ${errorMessage}`
    );
    return err(
      new Error(
        `S3からの読み込み失敗: ${
          !textRes.ok ? `textKey (${textKey})` : `llmKey (${llmKey})`
        }`
      )
    );
  }

  console.log(`[combinePageResults] S3からデータ取得成功`);
  const text = textRes.value.toString("utf-8");
  const llm = llmRes.value.toString("utf-8");

  console.log(
    `[combinePageResults] 抽出テキスト: ${text.length}文字, LLM結果: ${llm.length}文字`
  );

  // チェックリスト生成（リトライロジック含む）
  const checklistResult = await generateValidChecklist(
    text,
    llm,
    bedrock,
    modelId,
    inferenceConfig,
    2 // 最大2回リトライ
  );

  if (!checklistResult.ok) {
    console.error(
      `[combinePageResults] チェックリスト生成失敗: ${checklistResult.error.message}`
    );
    return err(checklistResult.error);
  }

  const checklist = checklistResult.value;
  console.log(
    `[combinePageResults] 生成されたチェックリスト: ${checklist.length}文字`
  );

  // S3に書き込む
  const combinedKey = getPageCombinedKey(documentId, pageNumber);
  console.log(`[combinePageResults] 結果をS3に保存開始: ${combinedKey}`);
  const result = await s3.uploadObject(combinedKey, Buffer.from(checklist));
  if (!result.ok) {
    console.error(
      `[combinePageResults] S3への書き込み失敗: ${result.error.message}`
    );
    return err(new Error("S3への書き込み失敗"));
  }
  console.log(`[combinePageResults] S3への書き込み成功`);

  console.log(
    `[combinePageResults] 処理完了: documentId=${documentId}, pageNumber=${pageNumber}`
  );
  return ok({ documentId, pageNumber });
}
