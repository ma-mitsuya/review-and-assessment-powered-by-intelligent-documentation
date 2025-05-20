以下にバックエンド API の定義があります。

- backend/src/api/features/checklist/routes/handlers.ts
- backend/src/api/features/review/routes/handlers.ts

上記の関連する実装を読み解き、Type Schema を特定してください。そして、

- frontend/src/features/review/types.ts
- frontend/src/features/checklist/types.ts

上記の Frontend の type 定義を完成させてください。このとき、命名規則は以下とします。

リクエスト系：XXRequest
レスポンス系：XXResponse

なお XX の命名はバックエンドの Route 定義と一致するように気をつけてください。
さらに、それぞれのコメントに、対応するバックエンドの Path やメソッド（GET など）も書いて、可読性を高めてください。
なお Frontend の実装は一切読む必要はありません。
