# Frontend 特記事項

## 基本

- vite React SPA
- tailwind
  - **スタイリングは必ず frontend/tailwind.config.js を使うこと**
    - frontend/tailwind.config.js の修正は厳禁
- ディレクトリ構成
  - pages, hooks,　 compoments などから構成
  - API フェッチは標準の fetch 利用
  - SWR 利用
  - hooks などアプリ共通で使うものは src のルートに配置で良いが、基本は feature ベースを採用
    - 機能ごとに features/\*ディレクトリを作成し、その下に hooks, components, etc を配置
- 実装の前に一度バックエンドのエンドポイントを見て把握すること
  - .amazonq/rules/api_specs 下に記載

## 言語

- すべて TypeScript。JavaScript 厳禁
- CommonJS は厳禁。いかなる時も ES Modules (ESM)利用すること

## コアコンポーネントの利用

- 実装の際は必ず frontend/src/components に下にあるコンポーネントの利用を試みよ
  - e.g. ボタンを利用する場合など。なお不足の場合は継承したボタンを各 features/components 下に作成せよ
