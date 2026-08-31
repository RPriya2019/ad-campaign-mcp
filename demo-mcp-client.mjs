import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["dist/index.js"],
  stderr: "inherit",
});

const client = new Client(
  { name: "demo-client", version: "1.0.0" },
  { capabilities: {} }
);

console.log("Connecting to ad-campaign-mcp server (this can take ~2 min on a cold start)...");
await client.connect(transport, { timeout: 180_000 });
console.log("MCP handshake successful\n");

const { tools } = await client.listTools();
console.log(
  "Available tools:",
  tools.map((t) => t.name)
);

console.log("\n--- Calling list_campaigns (no filter) ---");
let result = await client.callTool({ name: "list_campaigns", arguments: {} });
console.log(result.content[0].text);

console.log("\n--- Calling list_campaigns(status: active) ---");
result = await client.callTool({
  name: "list_campaigns",
  arguments: { status: "active" },
});
console.log(result.content[0].text);

console.log("\n--- Calling get_campaign(id: cmp-001) ---");
result = await client.callTool({
  name: "get_campaign",
  arguments: { id: "cmp-001" },
});
console.log(result.content[0].text);

console.log("\n--- Calling get_campaign(id: does-not-exist) — error handling ---");
result = await client.callTool({
  name: "get_campaign",
  arguments: { id: "does-not-exist" },
});
console.log("isError:", result.isError, "|", result.content[0].text);

await transport.close();
