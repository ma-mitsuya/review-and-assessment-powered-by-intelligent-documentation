import { ulid } from "ulid";

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export type McpServers = Record<string, McpServerConfig>;

export interface UserPreferenceModel {
  id: string;
  userId: string;
  language: string;
  mcpServers?: McpServers;
  createdAt: Date;
  updatedAt: Date;
}

export const UserPreferenceDomain = {
  create: (
    userId: string,
    language: string,
    mcpServers?: McpServers
  ): UserPreferenceModel => {
    return {
      id: ulid(),
      userId,
      language,
      mcpServers,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  // 汎用的な更新関数はそのままにしておく
  update: (
    existing: UserPreferenceModel,
    language?: string,
    mcpServers?: McpServers
  ): UserPreferenceModel => {
    return {
      ...existing,
      language: language !== undefined ? language : existing.language,
      mcpServers: mcpServers !== undefined ? mcpServers : existing.mcpServers,
      updatedAt: new Date(),
    };
  },

  // 言語専用の更新メソッド
  updateLanguage: (
    current: UserPreferenceModel,
    language: string
  ): UserPreferenceModel => {
    return {
      ...current,
      language,
      updatedAt: new Date(),
    };
  },

  // MCPサーバー専用の更新メソッド
  updateMcpServers: (
    current: UserPreferenceModel,
    mcpServers: McpServers
  ): UserPreferenceModel => {
    // バリデーションをここで実行
    const validationResult =
      UserPreferenceDomain.validateMcpServers(mcpServers);
    if (!validationResult.valid) {
      throw new Error(validationResult.error);
    }

    return {
      ...current,
      mcpServers,
      updatedAt: new Date(),
    };
  },

  getDefault: (userId: string): UserPreferenceModel => {
    return {
      id: "",
      userId,
      language: "en",
      mcpServers: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  validateMcpServers: (mcpServers: any): { valid: boolean; error?: string } => {
    if (!mcpServers || typeof mcpServers !== "object") {
      return {
        valid: false,
        error: "MCPサーバー設定はオブジェクトである必要があります",
      };
    }

    const servers = mcpServers as Record<string, unknown>;

    for (const [key, config] of Object.entries(servers)) {
      // 各サーバー設定の構造チェック
      if (!config || typeof config !== "object") {
        return {
          valid: false,
          error: `サーバー '${key}' の設定はオブジェクトである必要があります`,
        };
      }

      const serverConfig = config as Record<string, unknown>;

      // command フィールドのチェック
      if (!serverConfig.command || typeof serverConfig.command !== "string") {
        return {
          valid: false,
          error: `サーバー '${key}' に command フィールドが必要です`,
        };
      }

      // 許可されたコマンドのみ
      if (serverConfig.command !== "uvx" && serverConfig.command !== "npx") {
        return {
          valid: false,
          error: `サーバー '${key}' の command は 'uvx' または 'npx' のみ許可されています`,
        };
      }

      // args フィールドのチェック
      if (!serverConfig.args || !Array.isArray(serverConfig.args)) {
        return {
          valid: false,
          error: `サーバー '${key}' に args は配列である必要があります`,
        };
      }

      // argsのセキュリティチェック
      for (const arg of serverConfig.args) {
        if (typeof arg !== "string") {
          return {
            valid: false,
            error: `サーバー '${key}' の args は文字列のみを含む必要があります`,
          };
        }

        // awslabsから始まるもののみ許可
        if (!arg.startsWith("awslabs.")) {
          return {
            valid: false,
            error: `サーバー '${key}' の引数 '${arg}' はセキュリティ上の理由から 'awslabs.' で始まる必要があります`,
          };
        }
      }

      // env フィールドがある場合のチェック
      if (
        serverConfig.env !== undefined &&
        typeof serverConfig.env !== "object"
      ) {
        return {
          valid: false,
          error: `サーバー '${key}' の env はオブジェクトである必要があります`,
        };
      }
    }

    return { valid: true };
  },
};
