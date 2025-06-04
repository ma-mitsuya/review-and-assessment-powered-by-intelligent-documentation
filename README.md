# RAPID (Review & Assessment Powered by Intelligent Documentation)

## CDK デプロイ時のパラメータカスタマイズ

CDK デプロイ時に以下のパラメータをカスタマイズできます：

| パラメータ名             | 説明                                    | デフォルト値                              |
| ------------------------ | --------------------------------------- | ----------------------------------------- |
| dummyParameter           | ダミーパラメータ (例として実装)         | "default-value"                           |
| allowedIpV4AddressRanges | フロントエンド WAF で許可する IPv4 範囲 | ["0.0.0.0/1", "128.0.0.0/1"] (すべて許可) |
| allowedIpV6AddressRanges | フロントエンド WAF で許可する IPv6 範囲 | ["0000::/1", "8000::/1"] (すべて許可)     |

> **注意**: セキュリティ強化のため、フロントエンドへのアクセスを必要な IP アドレス範囲のみに制限することを強く推奨します。デフォルト設定ではすべての IP アドレスからのアクセスが許可されています。

### パラメータ指定方法

#### 1. parameter.ts で設定（推奨）

最も推奨される方法は、`cdk/lib/parameter.ts` ファイルを直接編集することです：

```typescript
// cdk/lib/parameter.ts
export const parameters = {
  // カスタマイズしたいパラメータのみコメントを外して設定
  // ---------------------------------------------------
  dummyParameter: "カスタム値",

  // WAF IP制限の設定例
  // セキュリティのため、必要なIPアドレス範囲のみに制限することを推奨
  allowedIpV4AddressRanges: [
    "192.168.0.0/16", // 内部ネットワーク例
    "203.0.113.0/24", // 特定のパブリックIP範囲例
  ],

  allowedIpV6AddressRanges: [
    "2001:db8::/32", // IPv6アドレス範囲例
  ],
};
```

この方法はシンプルで、バージョン管理にも適しています。必要なパラメータのみを指定すれば、未指定のパラメータはデフォルト値が使用されます。

#### 2. コマンドラインで context パラメータとして指定（代替方法）

一時的な変更や CI/CD 環境では、コマンドラインから `--context` フラグを使用してパラメータを渡すこともできます：

##### a. ドット表記形式

```bash
cdk deploy --context rapid.dummyParameter="custom-value"
```

##### b. JSON 形式

```bash
cdk deploy --context rapid='{"dummyParameter":"custom-value"}'
```

##### WAF IP 制限の設定例

```bash
# IPv4アドレス範囲のみ制限
cdk deploy --context rapid.allowedIpV4AddressRanges='["192.168.0.0/16", "203.0.113.0/24"]'

# IPv6アドレス範囲のみ制限
cdk deploy --context rapid.allowedIpV6AddressRanges='["2001:db8::/32"]'

# 両方を制限
cdk deploy --context rapid='{"allowedIpV4AddressRanges":["192.168.0.0/16"],"allowedIpV6AddressRanges":["2001:db8::/32"]}'
```

##### 複数パラメータの設定例

```bash
# ドット表記形式
cdk deploy --context rapid.dummyParameter="value1" --context rapid.anotherParameter="value2"

# JSON形式
cdk deploy --context rapid='{"dummyParameter":"value1","anotherParameter":"value2"}'
```

注意: コマンドラインで指定したパラメータは parameter.ts の設定より優先されます。

### 優先順位

パラメータ値の優先順位は以下の通りです：

1. コマンドライン引数 (`--context`)
2. parameter.ts で指定された値
3. デフォルト値 (parameter-schema.ts で定義)

### パラメータの検証

全てのパラメータは `parameter-schema.ts` で定義されたルールに基づいて検証され、無効な値の場合はエラーメッセージが表示されます。バリデーションロジックとデフォルト値はこのファイルで管理されています。

## デプロイ手順

[こちら](./docs/how_to_deploy.md)参照
