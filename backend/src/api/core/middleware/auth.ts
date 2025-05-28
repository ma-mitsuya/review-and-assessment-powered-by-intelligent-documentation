import { FastifyRequest, FastifyReply } from "fastify";
import { JwtVerifier } from "../utils/jwt-verifier";
import { handleLocalDevelopmentAuth } from "../utils/stage-aware-auth";

// 認証ミドルウェアのオプション
export interface AuthOptions {
  required?: boolean; // 認証が必須かどうか
}

// JWTトークンの検証と認証を行うミドルウェア
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  options: AuthOptions = { required: true }
) {
  try {
    // ローカル開発環境の場合は認証をバイパス
    const isLocalAuthHandled = await handleLocalDevelopmentAuth(request, reply);
    if (isLocalAuthHandled) {
      return; // ローカル開発環境では認証済みとして処理を続行
    }

    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      if (options.required) {
        return reply
          .code(401)
          .send({ success: false, error: "Authorization header is missing" });
      }
      return; // 認証が必須でない場合は続行
    }

    // Bearer トークンの形式を確認
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return reply.code(401).send({
        success: false,
        error: "Authorization header format is invalid",
      });
    }

    const token = parts[1];
    const verifier = new JwtVerifier();

    // トークンを検証
    const payload = await verifier.verify(token);

    // 検証に成功したらリクエストにユーザー情報を追加
    request.user = payload;
  } catch (error) {
    if (options.required) {
      return reply.code(401).send({
        success: false,
        error: "Invalid or expired token",
      });
    }
  }
}

// FastifyのTypeScriptの型定義を拡張
declare module "fastify" {
  interface FastifyRequest {
    user?: {
      sub: string;
      email?: string;
      "cognito:groups"?: string[];
      [key: string]: any;
    };
  }
}
