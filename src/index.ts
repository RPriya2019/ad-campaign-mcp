import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

const server = new McpServer({
  name: "ad-campaign-mcp",
  version: "1.0.0",
});

server.registerTool(
  "list_campaigns",
  {
    description: "List advertising campaigns",
    inputSchema: {
      status: z
        .enum(["active", "paused", "draft"])
        .optional()
        .describe("Filter campaigns by status"),
    },
  },
  async ({ status }) => {
    const url = new URL("/campaigns", API_BASE_URL);
    if (status) url.searchParams.set("status", status);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Campaign API returned ${response.status} ${response.statusText}: ${await response.text()}`,
            },
          ],
        };
      }

      const campaigns = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(campaigns, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to reach campaign API at ${API_BASE_URL}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "get_campaign",
  {
    description: "Get a single advertising campaign by id",
    inputSchema: {
      id: z.string().describe("The campaign id"),
    },
  },
  async ({ id }) => {
    const url = new URL(`/campaigns/${encodeURIComponent(id)}`, API_BASE_URL);

    try {
      const response = await fetch(url);

      if (response.status === 404) {
        return {
          isError: true,
          content: [{ type: "text", text: `Campaign ${id} not found` }],
        };
      }

      if (!response.ok) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Campaign API returned ${response.status} ${response.statusText}: ${await response.text()}`,
            },
          ],
        };
      }

      const campaign = await response.json();

      return {
        content: [{ type: "text", text: JSON.stringify(campaign, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to reach campaign API at ${API_BASE_URL}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();

await server.connect(transport);
