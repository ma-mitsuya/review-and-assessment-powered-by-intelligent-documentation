import { Handler, Context } from "aws-lambda";

// Ref: https://github.com/awslabs/run-model-context-protocol-servers-with-aws-lambda
import { stdioServerAdapter } from "@aws/run-mcp-servers-with-aws-lambda";
import { z } from "zod";
import { fileURLToPath } from "url";
import * as path from "node:path";
import * as fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as util from "node:util";

const execFileAsync = promisify(execFile);
const log = console; // simple alias

/* ------------------------------------------------------------------------- */
/*  Folder & cache settings                                                  */

const FIXED_ENV = {
  HOME: "/tmp",
  NPM_CONFIG_CACHE: "/tmp/.npm",
  npm_config_cache: "/tmp/.npm", // npm@11 expects lowercase
} as const;

const PROTECTED_KEYS = new Set(Object.keys(FIXED_ENV));
const SIZE_LIMIT = 400 * 1024 * 1024; // 400 MB
const LATEST_PROTOCOL_VERSION = "2025-03-26";

function dirSize(p: string): number {
  if (!fs.existsSync(p)) return 0;
  const st = fs.statSync(p);
  if (!st.isDirectory()) return st.size;
  return fs
    .readdirSync(p)
    .map((f: string) => dirSize(path.join(p, f)))
    .reduce((a: number, b: number) => a + b, 0);
}

async function maybePruneNpmCache(): Promise<void> {
  const cacheDir = FIXED_ENV.NPM_CONFIG_CACHE;
  const used = dirSize(cacheDir);
  if (used > SIZE_LIMIT) {
    log.info(`[cache] ${used / 1e6} MB > limit, pruning /tmp/.npm`);
    await execFileAsync("/bin/rm", ["-rf", cacheDir]);
    fs.mkdirSync(cacheDir, { recursive: true });
  }
}

/* ------------------------------------------------------------------------- */
/*  Path helpers (ESM-friendly __dirname)                                    */

const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename);

const npxCli = path.join(
  __dirname,
  "node_modules",
  "npm",
  "bin",
  "npx-cli.js" // bundled with the lambda (via nodeModules: ['npm'])
);

/* ------------------------------------------------------------------------- */
/*  Event schema                                                             */

const McpServerSpec = z
  .object({
    command: z.string().optional(), // e.g. 'npx'
    args: z.array(z.string()).optional(), // e.g. ['-y','firecrawl-mcp']
    env: z.record(z.string()).optional(),
    cwd: z.string().optional(),
  })
  .strict();

/* ------------------------------------------------------------------------- */
/*  Defaults                                                                 */

const DEFAULT_ARGS = [
  npxCli,
  "-y",
  "awslabs.aws-documentation-mcp-server@latest",
];

/* ------------------------------------------------------------------------- */
/*  Lambda handler                                                           */

/**
 * Handle initialize request by negotiating protocol version and capabilities
 */
function handleInitialize(params: any, id: string | number): any {
  // Protocol version negotiation
  const clientVersion = params.protocolVersion;

  // Check if client version is supported
  if (clientVersion !== LATEST_PROTOCOL_VERSION) {
    return {
      jsonrpc: "2.0",
      error: {
        code: -32602,
        message: "Unsupported protocol version",
        data: {
          supported: [LATEST_PROTOCOL_VERSION],
          requested: clientVersion,
        },
      },
      id,
    };
  }

  // Return capabilities
  return {
    jsonrpc: "2.0",
    id,
    result: {
      protocolVersion: LATEST_PROTOCOL_VERSION,
      capabilities: {
        logging: {},
        prompts: {
          listChanged: true,
        },
        resources: {
          subscribe: true,
          listChanged: true,
        },
        tools: {
          listChanged: true,
        },
      },
      serverInfo: {
        name: "MCPLambdaServer",
        version: "1.0.0",
      },
    },
  };
}

export const handler: Handler = async (event: any, ctx: Context) => {
  log.debug("[handler] event", util.inspect(event, { depth: null }));

  // Special handling for initialize requests
  if (event.method === "initialize" && event.params) {
    return handleInitialize(event.params, event.id);
  }

  // Ignore initialized notification (no response needed for stateless implementation)
  if (event.method === "initialized" && !event.id) {
    return; // No response for notifications
  }

  const spec = event?.mcpServer
    ? (() => {
        const parsed = McpServerSpec.safeParse(event.mcpServer);
        if (!parsed.success) {
          log.warn("[spec] validation failed", parsed.error.issues);
          return undefined;
        }
        return parsed.data;
      })()
    : undefined;

  fs.mkdirSync(FIXED_ENV.NPM_CONFIG_CACHE, { recursive: true });
  await maybePruneNpmCache();

  const wantsRawNpx = spec?.command === "npx";
  const command = wantsRawNpx
    ? process.execPath
    : spec?.command ?? process.execPath;

  const args = wantsRawNpx
    ? [npxCli, ...(spec?.args ?? [])]
    : spec?.args ?? DEFAULT_ARGS;

  const mergedEnv: Record<string, string> = {
    ...process.env,
    ...FIXED_ENV,
  };
  if (spec?.env) {
    for (const [k, v] of Object.entries(spec.env)) {
      if (PROTECTED_KEYS.has(k)) {
        log.debug(`[env] user key "${k}" ignored (protected)`);
        continue;
      }
      mergedEnv[k] = v;
    }
  }

  const serverParams = {
    command,
    args,
    env: mergedEnv,
    cwd: spec?.cwd,
  };

  const pretty = {
    ...serverParams,
    env: Object.keys(serverParams.env).sort(),
  };
  log.info("[serverParams]", util.inspect(pretty, { depth: null }));

  /* 6️⃣ launch through stdioServerAdapter */
  // ─────────────────────────────────────────────────────────────
  // Remove the Lambda-specific `mcpServer` field before handing
  // the event to stdioServerAdapter.  The JSON-RPC schemas inside
  // the adapter are strict and reject any unknown properties;
  // leaving this key in would trigger a −32600 "InvalidRequest".
  // ─────────────────────────────────────────────────────────────
  const { mcpServer: _ignored, ...rpcMessage } = event;
  return stdioServerAdapter(serverParams, rpcMessage, ctx);
};
