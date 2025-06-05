import { FastifyInstance } from "fastify";
import { getUserPreferenceHandler, updateLanguageHandler } from "./handlers";

export function registerUserPreferenceRoutes(fastify: FastifyInstance): void {
  // ユーザー設定の取得
  fastify.get("/user/preference", {
    handler: getUserPreferenceHandler,
  });

  // 言語設定の更新
  fastify.put("/user/preference/language", {
    handler: updateLanguageHandler,
  });
}
