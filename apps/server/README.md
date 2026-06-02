# server

Bun + SQLite backend for the observability dashboard. Receives hook events over
HTTP (`POST /events`), persists them to SQLite (`events.db`), and broadcasts them
to connected dashboard clients over a WebSocket (`/stream`).

Install dependencies:

```bash
bun install
```

Run (watch mode):

```bash
bun run dev
```

The entry point is `src/index.ts`. Port is configurable via `SERVER_PORT`
(default `4000`).

This project was created using `bun init` in bun v1.2.17. [Bun](https://bun.sh)
is a fast all-in-one JavaScript runtime.

## Security & scope

This server is built as a **local, single-user developer tool** and is meant to
bind to `localhost` only. It deliberately ships without network hardening:

- **No authentication / authorization.** Every endpoint is open; anyone who can
  reach the port can read events and post new ones.
- **CORS is fully open** (`Access-Control-Allow-Origin: *`) so the local Vite
  dev client can talk to it from any origin.
- **Event payloads are stored verbatim** and may contain prompts, file contents,
  and tool output from your sessions.

Because of this, **do not expose this server to a public network or untrusted
host as-is.** If you ever need to run it beyond `localhost`, put it behind a
reverse proxy that adds authentication and a restrictive CORS allow-list, and
review what the stored events contain first.
