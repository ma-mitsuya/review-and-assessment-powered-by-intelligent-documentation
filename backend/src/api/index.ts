/**
 * APIエントリーポイント
 */
import { createApp } from "./core/app";
import { registerChecklistRoutes } from "./features/checklist";
import { registerDocumentRoutes } from "./features/document";
import { registerReviewRoutes } from "./features/review";

/**
 * アプリケーションを起動する
 */
async function startApp() {
  const app = createApp();

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
