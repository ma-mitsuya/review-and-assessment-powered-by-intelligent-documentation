/**
 * CDKデプロイのカスタムパラメータ設定ファイル
 *
 * このファイルは、CDKデプロイ時に使用するパラメータをカスタマイズするためのものです。
 * デフォルトでは空のオブジェクトになっています。
 * 変更したいパラメータがある場合のみ、以下のサンプルのようにコメントを外して値を設定してください。
 */

export const parameters = {
  // カスタマイズしたいパラメータのみコメントを外して設定
  // ---------------------------------------------------
  // WAF IP制限の設定
  // アクセスを許可するIPアドレス範囲を指定します
  // デフォルト値は全てのIPアドレスを許可します
  // ---------------------------------------------------
  // allowedIpV4AddressRanges: [
  //   "192.168.0.0/16",  // 内部ネットワーク例
  //   "203.0.113.0/24"   // 特定のパブリックIP範囲例
  // ],
  //
  // allowedIpV6AddressRanges: [
  //   "2001:db8::/32"    // IPv6アドレス範囲例
  // ],
  // Cognito認証関連の設定
  // 既存のCognitoリソースをインポートして使用する場合に設定します
  // 設定しない場合は新しいリソースが作成されます
  // ---------------------------------------------------
  // cognitoUserPoolId: "ap-northeast-1_xxxxxxxxx", // 既存のCognito User Pool ID
  // cognitoUserPoolClientId: "1example23456789", // 既存のCognito User Pool Client ID
  // cognitoDomainPrefix: "myapp-login", // Cognitoドメインのプレフィックス
  // cognitoSelfSignUpEnabled: false, // Cognito User Poolのセルフサインアップを無効化（セキュリティ強化のため推奨）
  // Prismaマイグレーション設定
  // デプロイ時に自動的にマイグレーションを実行するかどうか
  // ---------------------------------------------------
  // autoMigrate: true, // デフォルトはtrue（自動マイグレーションを実行する）
  // MCP Runtime設定
  // mcpAdmin: true, // MCPランタイムLambda関数に管理者権限を付与する（デフォルト：false、本番環境では推奨されません）
  
  // Map State並行処理設定
  // 並行処理数はサービスの負荷とスロットリングに影響します
  // ---------------------------------------------------
  // reviewMapConcurrency: 1, // レビュープロセッサのMap State並行処理数（デフォルト：1）
  // checklistInlineMapConcurrency: 1, // チェックリストプロセッサのインラインMap State並行処理数（デフォルト：1）
  // checklistDistributedMapConcurrency: 1, // チェックリストプロセッサの分散Map State並行処理数（デフォルト：1）
};
