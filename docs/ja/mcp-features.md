# MCP 機能の詳細

本サンプルでは、Model Context Protocol (MCP) を活用して審査ワークフローを拡張できます。このドキュメントでは、MCP 機能の概要、設定方法、および安全な利用についての注意点を説明します。

## MCP とは

[Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) は、AI モデルに外部リソースや機能へのアクセスを提供する標準化されたプロトコルです。これにより、AI エージェントは現実世界のデータにアクセスし、より正確で有用な応答を提供できるようになります。

## 本サンプルでの MCP 利用

本サンプルでは、書類審査プロセスにおいて、MCP を使用して以下のような拡張機能を実現可能です：

- 審査時に外部情報源へのアクセス
- Web 検索やスクレイピングによる事実確認
- 地理情報の検証

## MCP の実装メカニズム

本サンプルでは、MCP サーバとして頻繁に利用される [npx](https://docs.npmjs.com/cli/v8/commands/npx) や [uvx](https://docs.astral.sh/uv/guides/tools/) のランタイムとして Lambda 関数を利用しています。実装は stdio ベースの MCP のラッパーである[Run Model Context Protocol (MCP) servers with AWS Lambda](https://github.com/awslabs/run-model-context-protocol-servers-with-aws-lambda)に依存しています。Lambda ハンドラーの実装も合わせてご確認ください：[Python ハンドラ](../../cdk/lib/constructs/mcp-runtime/python/index.py)、[NodeJS ハンドラ](../../cdk/lib/constructs/mcp-runtime/typescript/handler.ts)。

## 制約事項

> [!Warning]
> セキュリティ上の留意事項を含むため、この項目をよく読まれることを強く推奨します。

npx や uvx など任意のコマンドを実行できる環境の存在はセキュリティ上望ましいとは言えません。そこで本サンプルは**デフォルトで[AWS MCP Servers](https://github.com/awslabs/mcp)で公開されている MCP サーバーのみをサポート**しています。また上記 Lambda のランタイム環境の権限はデフォルトで大きく制限されているため、たとえば Bedrock Knowledge Base へのアクセスのための MCP サーバ ([doc](https://github.com/awslabs/mcp/tree/main/src/bedrock-kb-retrieval-mcp-server))や、地理情報へアクセスするための Amazon Location Service MCP サーバ ([doc](https://github.com/awslabs/mcp/tree/main/src/aws-location-mcp-server))を利用するには権限付与が必要です。本サンプルでは手軽に試すことができるよう`cdk/lib/parameter.ts`にオプションを用意しています：

```typescript
export const parameters = {
  // MCP Runtime設定
  // mcpAdmin: true, // MCPランタイムLambda関数に管理者権限を付与する（デフォルト：false）
};
```

`mcpAdmin` パラメータを `true` に設定すると、MCP ランタイムに **AdministratorAccess** 権限が付与されます。これは利便性が高い反面、セキュリティリスクになり得ます。そのため、`mcpAdmin: true`の設定は**PoC（概念実証）用途でのみ利用することを強く推奨します**。実際の運用では下記の点に留意する必要があります：

- 必要最小限の権限のみを持つカスタム IAM ポリシーを作成し、適用
- [Python ハンドラ](../../cdk/lib/constructs/mcp-runtime/python/index.py)、[NodeJS ハンドラ](../../cdk/lib/constructs/mcp-runtime/typescript/handler.ts)を編集し、コマンド実行前に適切なサニタイズを実施（ホワイトリスト形式で実行できるコマンドを制限する等）

## (開発者向け) MCP 利用の仕組み

本サンプルでは、エージェント SDK である[Strands Agents](https://github.com/strands-agents/sdk-python) を通じて MCP を利用しています。

### 任意の MCP を利用する

[agent.py](../../backend/src/review-workflow/review-item-processor/agent.py)を参照してください。特に`create_mcp_client`関数が MCP クライアントの生成を担当しており、編集することでカスタマイズが可能です。

```python
def create_mcp_client(mcp_server_cfg: Dict[str, Any]) -> MCPClient:
    """
    Create an MCP client for the given server configuration.
    """
    logger.debug(f"Creating MCP client with config: {mcp_server_cfg}")
    cmd = mcp_server_cfg.get("command")

    if cmd == "uvx":
        fn_arn = PY_MCP_LAMBDA_ARN
        logger.debug(f"Using Python MCP Lambda ARN: {fn_arn}")
    elif cmd == "npx":
        fn_arn = NODE_MCP_LAMBDA_ARN
        logger.debug(f"Using Node MCP Lambda ARN: {fn_arn}")
    else:
        raise ValueError(f"Unsupported command: {cmd}")

    return MCPClient(
        lambda: lambda_function_client(
            LambdaFunctionParameters(
                function_name=fn_arn, region_name=AWS_REGION, mcp_server=mcp_server_cfg
            )
        )
    )
```
