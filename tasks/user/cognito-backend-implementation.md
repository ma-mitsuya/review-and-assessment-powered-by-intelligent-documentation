## 2. バックエンドでJWT認証ミドルウェアの実装

### 新規作成するファイル

#### `backend/src/api/core/middleware/auth.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtVerifier } from '../utils/jwt-verifier';

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
    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      if (options.required) {
        return reply.code(401).send({ success: false, error: 'Authorization header is missing' });
      }
      return; // 認証が必須でない場合は続行
    }

    // Bearer トークンの形式を確認
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return reply.code(401).send({ success: false, error: 'Authorization header format is invalid' });
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
        error: 'Invalid or expired token' 
      });
    }
  }
}

// FastifyのTypeScriptの型定義を拡張
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      sub: string;
      email?: string;
      'cognito:groups'?: string[];
      [key: string]: any;
    };
  }
}
```

#### `backend/src/api/core/utils/jwt-verifier.ts`

```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose';

export class JwtVerifier {
  private jwksUri: string;
  private issuer: string;
  private clientId: string;
  private jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor() {
    // 環境変数から設定を取得
    const region = process.env.AWS_REGION || 'ap-northeast-1';
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;

    if (!userPoolId) {
      throw new Error('COGNITO_USER_POOL_ID environment variable is not set');
    }

    if (!clientId) {
      throw new Error('COGNITO_CLIENT_ID environment variable is not set');
    }

    this.issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    this.jwksUri = `${this.issuer}/.well-known/jwks.json`;
    this.clientId = clientId;
    this.jwks = createRemoteJWKSet(new URL(this.jwksUri));
  }

  async verify(token: string): Promise<any> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.clientId,
      });

      return payload;
    } catch (error) {
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
```

### 修正するファイル

#### `backend/src/api/core/app.ts`

```typescript
/**
 * Fastifyアプリケーションの作成
 */
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import responseLogger from '../core/plugins/response-logger';

/**
 * Fastifyアプリケーションを作成する
 * @returns Fastifyインスタンス
 */
export function createApp(): FastifyInstance {
  const app = Fastify({
    logger: true
  });
  
  // CORSの設定
  app.register(cors, {
    origin: process.env.CORS_ORIGIN || '*'
  });
  
  // レスポンスロガープラグインを登録
  app.register(responseLogger, {
    logLevel: 'info'
  });
  
  // 空のJSONボディを処理するためのカスタムパーサーを追加
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    if (body === '' || body === null) {
      done(null, {});
    } else {
      // 既存のパーサーを使用して処理
      try {
        const json = JSON.parse(body as string);
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    }
  });
  
  // ヘルスチェックエンドポイント
  app.get('/health', async (_, reply) => {
    reply.code(200).send({ status: 'ok' });
  });

  // 認証情報確認エンドポイント
  app.get('/auth/me', async (request, reply) => {
    reply.code(200).send({ 
      success: true, 
      data: { 
        user: request.user 
      } 
    });
  });
  
  return app;
}
```

#### `backend/src/api/index.ts`

```typescript
/**
 * APIエントリーポイント
 */
import { createApp } from "./core/app";
import { registerChecklistRoutes } from "./features/checklist";
import { registerDocumentRoutes } from "./features/document";
import { registerReviewRoutes } from "./features/review";
import { authMiddleware } from "./core/middleware/auth";

/**
 * アプリケーションを起動する
 */
async function startApp() {
  const app = createApp();

  // 認証ミドルウェアをデコレータとして登録
  app.decorate('auth', (request: any, reply: any) => authMiddleware(request, reply));

  // 認証が不要なパスのリスト
  const publicPaths = ['/health', '/api/health'];

  // グローバルなpreHandlerフックを追加して、すべてのルートに認証を適用
  app.addHook('preHandler', async (request, reply) => {
    // 公開パスの場合は認証をスキップ
    if (publicPaths.some(path => request.url.startsWith(path))) {
      return;
    }
    
    // それ以外は認証を実行
    await authMiddleware(request, reply);
  });

  // ルートの登録
  registerChecklistRoutes(app);
  registerDocumentRoutes(app);
  registerReviewRoutes(app);

  // アプリケーションの起動
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    const host = process.env.HOST || "0.0.0.0";

    await app.listen({ port, host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  startApp();
}

// テスト用にエクスポート
export { createApp };
```

#### `backend/package.json` (依存関係の追加)

```json
{
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.787.0",
    "@aws-sdk/client-s3": "^3.787.0",
    "@aws-sdk/client-secrets-manager": "^3.777.0",
    "@aws-sdk/client-sfn": "^3.787.0",
    "@aws-sdk/s3-request-presigner": "^3.787.0",
    "@fastify/cors": "^8.3.0",
    "prisma": "^6.6.0",
    "@prisma/client": "^6.6.0",
    "canvas": "^3.1.0",
    "csv-parser": "^3.2.0",
    "fastify": "^4.24.3",
    "jose": "^5.2.0",
    "mysql2": "^3.6.1",
    "pdf-lib": "^1.17.1",
    "pdfjs-dist": "^5.1.91",
    "ulid": "^2.4.0"
  }
}
```

### 各機能のルート登録ファイルの修正

グローバルな認証フックを追加したため、各ルート登録ファイルでは個別に `preHandler: [app.auth]` を指定する必要がなくなりました。例として、チェックリスト機能のルート登録ファイルを示します。

#### `backend/src/api/features/checklist/routes.ts`

```typescript
import { FastifyInstance } from 'fastify';
import * as controller from './controller';

export function registerChecklistRoutes(app: FastifyInstance) {
  // チェックリストセット一覧の取得
  app.get('/api/checklist-sets', controller.getChecklistSets);

  // チェックリストセット詳細の取得
  app.get('/api/checklist-sets/:id', controller.getChecklistSetDetail);

  // チェックリストセットの作成
  app.post('/api/checklist-sets', controller.createChecklistSet);

  // チェックリストセットの更新
  app.put('/api/checklist-sets/:id', controller.updateChecklistSet);

  // チェックリストセットの削除
  app.delete('/api/checklist-sets/:id', controller.deleteChecklistSet);

  // チェックリスト項目詳細の取得
  app.get('/api/checklist-sets/:setId/items/:itemId', controller.getChecklistItem);

  // チェックリスト項目の階層構造取得
  app.get('/api/checklist-sets/:setId/items/hierarchy', controller.getChecklistItemHierarchy);

  // チェックリスト項目の作成
  app.post('/api/checklist-sets/:setId/items', controller.createChecklistItem);

  // チェックリスト項目の更新
  app.put('/api/checklist-sets/:setId/items/:itemId', controller.updateChecklistItem);

  // チェックリスト項目の削除
  app.delete('/api/checklist-sets/:setId/items/:itemId', controller.deleteChecklistItem);
}
```

同様に、document機能とreview機能のルート登録ファイルも修正します。
