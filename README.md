# Ad Campaign MCP

An MCP (Model Context Protocol) client/server integration built with
TypeScript/Node.js. It connects an AI assistant to a small REST API over
structured, typed tools — with real error handling for a down API or a
missing record — rather than the assistant calling the API directly.

## Architecture

```
MCP client (AI assistant)
      │  stdio, JSON-RPC
      ▼
MCP server (src/index.ts)
      │  HTTP
      ▼
Campaign REST API (src/api.ts, Express)
      │  SQL
      ▼
Postgres (docker-compose.yml)
```

- **Postgres** — `advertisers`, `campaigns`, `impressions`, and `clicks`
  tables, created on API startup by `src/db.ts`.
- **REST API** (`src/api.ts`) — `GET /campaigns` (optionally filtered by
  `?status=`) and `GET /campaigns/:id`, backed by Postgres.
- **MCP server** (`src/index.ts`) — exposes two tools that call the REST
  API and translate its responses (including non-2xx statuses and
  connection failures) into MCP tool results.

## Getting started

```bash
cp .env.example .env      # then set DB_PASSWORD and API_KEY (openssl rand -hex 32)
docker compose up -d      # start Postgres
npm install
npm run api                # start the REST API on :3000
npm run build               # compile the MCP server to dist/
```

Run the MCP server directly during development with `npm run dev` (uses
`tsx`, no build step needed), or run the compiled version with
`node dist/index.js`. The compiled version starts noticeably faster,
since it skips on-the-fly TypeScript transpilation — worth using for an
MCP client that spawns the server, since `Client.connect()` has a
default 60s handshake timeout.

All configuration lives in `.env` (git-ignored; see `.env.example`).
`src/config.ts` loads it relative to the project root, so it is found
even when an MCP client spawns the server from another directory. The
API URL defaults to `http://localhost:3000`; override it with
`API_BASE_URL` if the REST API runs elsewhere.

Every REST API request must send the `x-api-key` header matching
`API_KEY`; the MCP server does this automatically. Postgres and the API
listen on `127.0.0.1` only.

## Sample API calls

There's no `POST /campaigns` endpoint yet, so the table starts empty —
seed a row directly via SQL first, or the calls below just return `[]`
/ `404`.

### Seed a campaign (direct SQL)

```bash
docker exec -it ad-campaign-postgres psql -U "$DB_USER" -d adplatform -c "
INSERT INTO advertisers (name) VALUES ('Acme Corp') RETURNING id;
-- suppose that returns id = 1
INSERT INTO campaigns (id, advertiser_id, name, status, budget, start_date, end_date)
VALUES ('camp_001', 1, 'Summer Launch', 'active', 5000.00, '2026-06-01', '2026-08-31');
"
```

### `GET /campaigns` — list all

```bash
source .env   # makes $API_KEY available in this shell
curl -H "x-api-key: $API_KEY" http://localhost:3000/campaigns
```

```json
[
  {
    "id": "camp_001",
    "advertiser_id": 1,
    "name": "Summer Launch",
    "status": "active",
    "budget": "5000.00",
    "start_date": "2026-06-01T00:00:00.000Z",
    "end_date": "2026-08-31T00:00:00.000Z",
    "created_at": "2026-08-29T10:00:00.000Z",
    "updated_at": "2026-08-29T10:00:00.000Z"
  }
]
```

### `GET /campaigns?status=active` — filtered by status

```bash
curl -H "x-api-key: $API_KEY" "http://localhost:3000/campaigns?status=active"
```

### `GET /campaigns/:id` — single campaign

```bash
curl -H "x-api-key: $API_KEY" http://localhost:3000/campaigns/camp_001
```

Returns the same object as above, unwrapped from the array.

### `GET /campaigns/:id` — not found

```bash
curl -i -H "x-api-key: $API_KEY" http://localhost:3000/campaigns/does-not-exist
```

```
HTTP/1.1 404 Not Found
{"error":"Campaign not found"}
```

## Tools exposed

- **`list_campaigns`** — list campaigns, optionally filtered by
  `status` (`active` | `paused` | `draft`).
- **`get_campaign`** — fetch a single campaign by `id`; returns an error
  result (not a thrown exception) for a 404 or an unreachable API.

## Trying it end-to-end

```bash
npm run build
node demo-mcp-client.mjs
```

This spawns the compiled MCP server, performs the MCP handshake, lists
its tools, and calls each one — including the 404 case — printing the
results.

## Known limitations

- Authentication is a single shared API key — fine for local use, but
  there are no per-user accounts or permissions.
- No `POST`/`PUT` endpoints yet — campaigns can only be seeded directly
  via SQL, not created through the API or the MCP tools.

## License

MIT
