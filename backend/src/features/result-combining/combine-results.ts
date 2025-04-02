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
import { Checklist, ChecklistItem, CombinedPageResult } from "./types";
import { CHECKLIST_PROMPT } from "./prompt";
import { modelId } from "../../core/bedrock/model-id";
import { v4 as uuidv4 } from 'uuid';

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
  if (header !== "id,name,condition,parentId,dependsOn,allRequired,required") {
    return { isValid: false, message: `ヘッダーが不正です: "${header}"` };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;

    // カンマで区切られた各フィールドを抽出（引用符内のカンマは考慮）
    const fields = extractCsvFields(line);

    if (fields.length !== 7) {
      return {
        isValid: false,
        message: `行 ${i + 1} のフィールド数が不正です: ${
          fields.length
        } (期待値: 7)`,
      };
    }

    const [id, , , , , allRequired, required] = fields;
    
    // IDがUUID形式かチェック
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return {
        isValid: false,
        message: `行 ${i + 1} のidフィールドがUUID形式ではありません: "${id}"`,
      };
    }

    // allRequiredとrequiredがbooleanかチェック
    if (allRequired !== "true" && allRequired !== "false") {
      return {
        isValid: false,
        message: `行 ${i + 1} のallRequiredフィールドが不正です: "${allRequired}"`,
      };
    }

    if (required !== "true" && required !== "false") {
      return {
        isValid: false,
        message: `行 ${i + 1} のrequiredフィールドが不正です: "${required}"`,
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
 * CSVをパースしてChecklistオブジェクトに変換する
 * @param csv CSVデータ文字列
 * @returns パース結果
 */
export function parseCsvToChecklist(csv: string): Result<Checklist, Error> {
  try {
    const lines = csv.trim().split("\n");
    if (lines.length <= 1) {
      return err(new Error("CSVにデータ行がありません"));
    }

    const items: ChecklistItem[] = [];
    
    // ヘッダー行をスキップ
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === "") continue;

      const fields = extractCsvFields(line);
      if (fields.length !== 7) {
        return err(new Error(`行 ${i + 1} のフィールド数が不正です: ${fields.length}`));
      }

      const [id, name, condition, parentId, dependsOnStr, allRequired, required] = fields;
      
      // dependsOnは複数のIDをカンマ区切りで指定可能
      // 引用符で囲まれている場合は引用符を除去
      let dependsOn: string[] | undefined = undefined;
      if (dependsOnStr) {
        // 引用符で囲まれている場合は内部のカンマを正しく処理
        if (dependsOnStr.startsWith('"') && dependsOnStr.endsWith('"')) {
          // 引用符を除去して内部のカンマで分割
          const innerStr = dependsOnStr.substring(1, dependsOnStr.length - 1);
          dependsOn = innerStr.split(",").map(id => id.trim());
        } else {
          dependsOn = dependsOnStr.split(",").map(id => id.trim());
        }
      }
      
      items.push({
        id,
        name,
        condition,
        parentId: parentId || undefined,
        dependsOn,
        allRequired: allRequired === "true",
        required: required === "true"
      });
    }

    return ok({ items });
  } catch (e) {
    return err(e instanceof Error ? e : new Error("CSVのパースに失敗しました"));
  }
}

/**
 * LLMに問い合わせてチェックリストを取得する純粋関数
 * @param extractedText 抽出されたテキスト
 * @param llmOcrText LLM OCRテキスト
 * @param bedrock Bedrockクライアント
 * @param modelId モデルID
 * @param inferenceConfig 推論設定
 * @param errorDetails エラー詳細（リトライ時に使用）
 */
export async function generateChecklist(
  extractedText: string,
  llmOcrText: string,
  bedrock: BedrockRuntimeClient,
  modelId: modelId,
  inferenceConfig: any,
  errorDetails?: string
): Promise<Result<string, Error>> {
  try {
    // エラー情報がある場合はエラー情報を含むプロンプトを使用
    const promptText = errorDetails 
      ? createPromptWithError(CHECKLIST_PROMPT, errorDetails)
      : CHECKLIST_PROMPT;

    const messages: Message[] = [
      {
        role: "user",
        content: [
          { text: promptText },
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
 * @param extractedText 抽出されたテキスト
 * @param llmOcrText LLM OCRテキスト
 * @param bedrock Bedrockクライアント
 * @param modelIdValue モデルID
 * @param inferenceConfig 推論設定
 * @param maxRetries 最大リトライ回数
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
  let lastErrorDetails: string | undefined;

  while (attempts <= maxRetries) {
    console.log(
      `[generateValidChecklist] 試行 ${attempts + 1}/${maxRetries + 1}`
    );

    const result = await generateChecklist(
      extractedText,
      llmOcrText,
      bedrock,
      modelIdValue,
      inferenceConfig,
      lastErrorDetails // 前回のエラー情報を渡す
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
      lastErrorDetails = `LLM呼び出しエラー: ${result.error.message}`;
      continue;
    }

    const checklist = result.value;
    const validation = validateCsvFormat(checklist);

    if (validation.isValid) {
      console.log(`[generateValidChecklist] 有効なCSVを生成しました`);
      return ok(checklist);
    }

    console.warn(`[generateValidChecklist] 無効なCSV: ${validation.message}`);
    lastErrorDetails = `CSV検証エラー: ${validation.message}`;
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

/**
 * LLMが生成したCSVが不正な場合に、既存のCSVを新しいフォーマットに変換する
 * @param csv 変換するCSV文字列
 */
export function convertLegacyFormatToNew(csv: string): Result<string, Error> {
  try {
    const lines = csv.trim().split("\n");
    if (lines.length === 0) {
      return err(new Error("CSVに行がありません"));
    }

    const header = lines[0].trim();
    if (header !== "id,name,condition") {
      return err(new Error(`想定外のヘッダー形式です: "${header}"`));
    }

    // 新しいヘッダー
    const newLines = ["id,name,condition,parentId,dependsOn,allRequired,required"];
    
    // 親子関係を追跡するマップ
    const parentMap = new Map<string, string>();
    
    // 各行を処理
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === "") continue;

      const fields = extractCsvFields(line);
      if (fields.length !== 3) {
        return err(new Error(`行 ${i + 1} のフィールド数が不正です: ${fields.length}`));
      }

      const [id, name, condition] = fields;
      
      // 親子関係を判定（1.1の場合、1が親）
      let parentId = "";
      const idParts = id.split(".");
      if (idParts.length > 1) {
        const parentIdValue = idParts.slice(0, -1).join(".");
        parentId = parentMap.get(parentIdValue) || "";
      }
      
      // 新しいUUIDを生成（TSで発行）
      const newId = uuidv4();
      
      // 元のIDと新しいUUIDのマッピングを保存
      parentMap.set(id, newId);
      
      // 新しい行を作成
      newLines.push(`${newId},${name},${condition},${parentId},,true,true`);
    }
    
    return ok(newLines.join("\n"));
  } catch (e) {
    return err(e instanceof Error ? e : new Error("CSVの変換に失敗しました"));
  }
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
      ? (textRes as any).error.message
      : (llmRes as any).error.message;
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

  let checklist: string;
  let parsedChecklist: Checklist | null = null;
  
  if (!checklistResult.ok) {
    console.warn(
      `[combinePageResults] 新形式のチェックリスト生成に失敗: ${checklistResult.error.message}。旧形式で再試行します。`
    );
    
    // 旧形式で再試行
    const legacyResult = await generateChecklist(
      text,
      llm,
      bedrock,
      modelId,
      inferenceConfig
    );
    
    if (!legacyResult.ok) {
      console.error(
        `[combinePageResults] チェックリスト生成失敗: ${legacyResult.error.message}`
      );
      return err(legacyResult.error);
    }
    
    // 旧形式から新形式に変換
    const convertResult = convertLegacyFormatToNew(legacyResult.value);
    if (!convertResult.ok) {
      console.error(
        `[combinePageResults] チェックリスト形式変換失敗: ${convertResult.error.message}`
      );
      return err(convertResult.error);
    }
    
    checklist = convertResult.value;
  } else {
    checklist = checklistResult.value;
  }

  // CSVをパースしてチェックリストオブジェクトに変換
  const parseResult = parseCsvToChecklist(checklist);
  if (!parseResult.ok) {
    console.error(
      `[combinePageResults] チェックリストのパース失敗: ${parseResult.error.message}`
    );
    return err(parseResult.error);
  }
  
  parsedChecklist = parseResult.value;
  
  // UUIDが空の項目にUUIDを割り当て
  const updatedItems = parsedChecklist.items.map(item => {
    // IDが空の場合、新しいUUIDを生成
    if (!item.id) {
      return {
        ...item,
        id: uuidv4()
      };
    }
    return item;
  });
  
  // 更新されたチェックリスト
  const updatedChecklist: Checklist = {
    items: updatedItems
  };
  
  // チェックリストをCSVに戻す
  const csvLines = [
    "id,name,condition,parentId,dependsOn,allRequired,required",
    ...updatedChecklist.items.map(item => {
      const dependsOnStr = item.dependsOn && item.dependsOn.length > 0 
        ? item.dependsOn.join(",") 
        : "";
      return `${item.id},${item.name},${item.condition},${item.parentId || ""},${dependsOnStr},${item.allRequired},${item.required}`;
    })
  ];
  
  const finalCsv = csvLines.join("\n");

  console.log(
    `[combinePageResults] 生成されたチェックリスト: ${finalCsv.length}文字`
  );

  // S3に書き込む
  const combinedKey = getPageCombinedKey(documentId, pageNumber);
  console.log(`[combinePageResults] 結果をS3に保存開始: ${combinedKey}`);
  const result = await s3.uploadObject(combinedKey, Buffer.from(finalCsv));
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
