import { config } from "dotenv";
import { fileURLToPath } from "node:url";

// Resolve .env relative to this file (src/ or dist/ -> project root), so it is
// found even when an MCP client spawns the server from a different directory.
// quiet: dotenv v17 logs to stdout by default, which would corrupt the MCP
// server's stdio JSON-RPC stream.
config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name} — copy .env.example to .env and fill it in`
    );
  }
  return value;
}
