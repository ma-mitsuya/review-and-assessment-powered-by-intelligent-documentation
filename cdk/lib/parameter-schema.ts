import { z } from "zod";
import { parameters as userParameters } from "./parameter";

/**
 * パラメータのスキーマ定義
 * ここにはバリデーションルールとデフォルト値を設定します。
 */
const parameterSchema = z.object({
  // WAF IPアドレス制限のパラメータ
  allowedIpV4AddressRanges: z
    .array(z.string())
    .default(["0.0.0.0/1", "128.0.0.0/1"]), // デフォルトはすべてのIPv4を許可

  allowedIpV6AddressRanges: z
    .array(z.string())
    .default([
      "0000:0000:0000:0000:0000:0000:0000:0000/1",
      "8000:0000:0000:0000:0000:0000:0000:0000/1",
    ]), // デフォルトはすべてのIPv6を許可

  // 新しいパラメータを追加する場合はここに定義します
  // 例: newParameter: z.string().default("default"),
  // 例: isEnabled: z.boolean().default(false),
  // 例: count: z.number().int().min(0).max(100).default(10),

  // Cognito認証関連のパラメータ
  cognitoUserPoolId: z.string().optional(),

  cognitoUserPoolClientId: z.string().optional(),

  cognitoDomainPrefix: z.string().optional(),

  cognitoSelfSignUpEnabled: z
    .boolean()
    .default(true)
    .describe("Cognito User Poolのセルフサインアップを有効にするかどうか"),
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

    // バリデーションを実行（デフォルト値は自動的に適用される）
    const validatedParams = parameterSchema.parse(mergedParams);

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
    } catch (e) {
      // 文字列のままにしておく
      rapidObject = rapidParam;
    }
  }

  // 'rapid'オブジェクトがある場合はそれを使用
  if (rapidObject && typeof rapidObject === "object") {
    Object.assign(params, rapidObject);
  }

  // WAF IPアドレス制限パラメータの取得
  const allowedIpV4Ranges = app.node.tryGetContext(
    "rapid.allowedIpV4AddressRanges"
  );
  if (allowedIpV4Ranges !== undefined) {
    params.allowedIpV4AddressRanges = Array.isArray(allowedIpV4Ranges)
      ? allowedIpV4Ranges
      : [allowedIpV4Ranges];
  }

  const allowedIpV6Ranges = app.node.tryGetContext(
    "rapid.allowedIpV6AddressRanges"
  );
  if (allowedIpV6Ranges !== undefined) {
    params.allowedIpV6AddressRanges = Array.isArray(allowedIpV6Ranges)
      ? allowedIpV6Ranges
      : [allowedIpV6Ranges];
  }

  // Cognito関連パラメータの取得
  const cognitoUserPoolId = app.node.tryGetContext("rapid.cognitoUserPoolId");
  if (cognitoUserPoolId !== undefined) {
    params.cognitoUserPoolId = cognitoUserPoolId;
  }

  const cognitoUserPoolClientId = app.node.tryGetContext(
    "rapid.cognitoUserPoolClientId"
  );
  if (cognitoUserPoolClientId !== undefined) {
    params.cognitoUserPoolClientId = cognitoUserPoolClientId;
  }

  const cognitoDomainPrefix = app.node.tryGetContext(
    "rapid.cognitoDomainPrefix"
  );
  if (cognitoDomainPrefix !== undefined) {
    params.cognitoDomainPrefix = cognitoDomainPrefix;
  }

  // セルフサインアップ有効/無効設定の取得
  const cognitoSelfSignUpEnabled = app.node.tryGetContext(
    "rapid.cognitoSelfSignUpEnabled"
  );
  if (cognitoSelfSignUpEnabled !== undefined) {
    params.cognitoSelfSignUpEnabled =
      cognitoSelfSignUpEnabled === "true" || cognitoSelfSignUpEnabled === true;
  }

  return params;
}
