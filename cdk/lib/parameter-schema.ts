import { z } from "zod";
import { parameters as userParameters } from "./parameter";

/**
 * パラメータのスキーマ定義
 * ここにはバリデーションルールとデフォルト値を設定します。
 */
const parameterSchema = z.object({
  // ダミーのstring型パラメータ
  dummyParameter: z
    .string()
    .min(1, "dummyParameter must not be empty")
    .default("default-value"),

  // 新しいパラメータを追加する場合はここに定義します
  // 例: newParameter: z.string().default("default"),
  // 例: isEnabled: z.boolean().default(false),
  // 例: count: z.number().int().min(0).max(100).default(10),
});

// パラメータの型定義（型安全性のため）
export type Parameters = z.infer<typeof parameterSchema>;

/**
 * パラメータを解決して検証する関数
 * 優先順位: デフォルト値 < parameter.ts < コンテキストパラメータ
 */
export function resolveParameters(
  contextParams: Record<string, any> = {}
): Parameters {
  try {
    // パラメータをマージ
    const mergedParams = {
      ...userParameters, // parameter.tsからの値
      ...contextParams, // コンテキストパラメータ（コマンドラインから渡された値）
    };

    console.log("User defined parameters:", userParameters);
    console.log("Context parameters:", contextParams);
    console.log("Merged parameters (before validation):", mergedParams);

    // バリデーションを実行（デフォルト値は自動的に適用される）
    const validatedParams = parameterSchema.parse(mergedParams);
    console.log("Final validated parameters:", validatedParams);

    return validatedParams;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Parameter validation failed:");
      error.errors.forEach((err) => {
        console.error(`- ${err.path.join(".")}: ${err.message}`);
      });
    } else {
      console.error(
        "An unexpected error occurred during parameter validation:",
        error
      );
    }
    throw error;
  }
}

/**
 * コマンドラインコンテキストからRapid関連のパラメータを抽出する関数
 */
export function extractContextParameters(app: any): Record<string, any> {
  const params: Record<string, any> = {};

  // 'rapid'オブジェクト全体を取得
  const rapidParam = app.node.tryGetContext("rapid");

  // rapidParamがJSON文字列の場合はパース
  let rapidObject = rapidParam;
  if (typeof rapidParam === "string") {
    try {
      rapidObject = JSON.parse(rapidParam);
      console.log("Parsed rapidParam from JSON string:", rapidObject);
    } catch (e) {
      console.log("rapidParam is not a valid JSON string");
      // 文字列のままにしておく
      rapidObject = rapidParam;
    }
  }

  // 'rapid'オブジェクトがある場合はそれを使用
  if (rapidObject && typeof rapidObject === "object") {
    console.log("Using rapid object:", rapidObject);
    Object.assign(params, rapidObject);
  }

  // 個別のパラメータ取得（rapid.dummyParameter形式）
  const dummyParam = app.node.tryGetContext("rapid.dummyParameter");
  if (dummyParam !== undefined) {
    console.log("Found direct parameter rapid.dummyParameter:", dummyParam);
    params.dummyParameter = dummyParam;
  }

  console.log("Extracted context parameters:", params);

  return params;
}
