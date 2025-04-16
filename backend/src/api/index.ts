/**
 * APIエントリーポイント
 */
import { createApp } from './core/app';
import { registerChecklistRoutes } from './features/checklist';
import { registerDocumentRoutes } from './features/document';
import { registerReviewRoutes } from './features/review';
import { fileURLToPath } from 'url';
import path from 'path';

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
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// ESMでは import.meta.url を使用して現在のファイルパスを取得
const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const mainModulePath = process.argv[1] ? fileURLToPath(new URL(process.argv[1], 'file:///')) : '';

// 現在のファイルが直接実行されている場合にアプリケーションを起動
if (currentFilePath === mainModulePath) {
  startApp();
}

// テスト用にエクスポート
export { createApp };
