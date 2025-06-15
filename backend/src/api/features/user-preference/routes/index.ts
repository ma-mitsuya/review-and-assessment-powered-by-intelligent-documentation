import { FastifyInstance } from "fastify";
import {
  getUserPreferenceHandler,
  updateLanguageHandler,
  getMcpServersHandler,
  updateMcpServersHandler,
} from "./handlers";

export function registerUserPreferenceRoutes(fastify: FastifyInstance): void {
  // ユーザー設定の取得
  fastify.get("/user/preference", {
    handler: getUserPreferenceHandler,
  });

  // 言語設定の更新
  fastify.put("/user/preference/language", {
    handler: updateLanguageHandler,
  });

  // MCPサーバー設定の取得
  fastify.get("/user/preference/mcp-servers", {
    handler: getMcpServersHandler,
  });

  // MCPサーバー設定の更新
  fastify.put("/user/preference/mcp-servers", {
    handler: updateMcpServersHandler,
  });
}
