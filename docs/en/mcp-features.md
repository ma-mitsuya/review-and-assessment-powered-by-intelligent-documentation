# MCP Feature Details

This sample demonstrates how to extend the review workflow using the Model Context Protocol (MCP). This document explains the overview of MCP features, configuration methods, and notes on safe usage.

## What is MCP

[Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) is a standardized protocol that provides AI models with access to external resources and functionalities. This enables AI agents to access real-world data and provide more accurate and useful responses.

## MCP Usage in This Sample

In this sample, MCP can be used to implement the following enhanced functionalities in the document review process:

- Access to external information sources during review
- Fact verification through web searches and scraping
- Geographic information validation

## MCP Implementation Mechanism

This sample uses Lambda functions as the runtime for commonly used MCP servers such as [npx](https://docs.npmjs.com/cli/v8/commands/npx) and [uvx](https://docs.astral.sh/uv/guides/tools/). The implementation relies on [Run Model Context Protocol (MCP) servers with AWS Lambda](https://github.com/awslabs/run-model-context-protocol-servers-with-aws-lambda), which is a stdio-based wrapper for MCP. Please also check the Lambda handler implementations: [Python handler](../cdk/lib/constructs/mcp-runtime/python/index.py), [NodeJS handler](../cdk/lib/constructs/mcp-runtime/typescript/handler.ts).

## Constraints

> [!Warning]
> It is strongly recommended to read this section carefully as it contains security considerations.

Having an environment that can execute arbitrary commands like npx and uvx is not ideal from a security perspective. Therefore, this sample **supports only the MCP servers published in [AWS MCP Servers](https://github.com/awslabs/mcp) by default**. Additionally, since the permissions in the Lambda runtime environment are highly restricted by default, permission grants are necessary to use MCP servers such as the Bedrock Knowledge Base MCP server ([doc](https://github.com/awslabs/mcp/tree/main/src/bedrock-kb-retrieval-mcp-server)) for accessing Bedrock Knowledge Base or the Amazon Location Service MCP server ([doc](https://github.com/awslabs/mcp/tree/main/src/aws-location-mcp-server)) for accessing geographic information. This sample provides options in `cdk/lib/parameter.ts` to make it easy to try:

```typescript
export const parameters = {
  // MCP Runtime configuration
  // mcpAdmin: true, // Grant administrator permissions to the MCP runtime Lambda function (default: false)
};
```

Setting the `mcpAdmin` parameter to `true` grants **AdministratorAccess** permissions to the MCP runtime. While this is highly convenient, it can also pose security risks. Therefore, it is **strongly recommended to use the `mcpAdmin: true` setting only for PoC (Proof of Concept) purposes**. For actual operations, the following points should be considered:

- Create and apply custom IAM policies with only the minimum necessary permissions
- Edit the [Python handler](../cdk/lib/constructs/mcp-runtime/python/index.py) and [NodeJS handler](../cdk/lib/constructs/mcp-runtime/typescript/handler.ts) to implement appropriate sanitization before command execution (such as restricting executable commands using a whitelist approach)

## (For Developers) How MCP Works in this Sample

This sample uses MCP through the agent SDK [Strands Agents](https://github.com/strands-agents/sdk-python).

### Using Custom MCP

Refer to [agent.py](../backend/src/review-workflow/review-item-processor/agent.py). Specifically, the `create_mcp_client` function is responsible for generating the MCP client and can be customized by editing it.

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
