# Claude Code Multi Agent Observability

## Instructions
> Follow these instructions as you work through the project.

### REMEMBER: Use source_app + session_id to uniquely identify an agent.

Every hook event will include a source_app and session_id. Use these to uniquely identify an agent.
For display purposes, we want to show the agent ID as "source_app:session_id" with session_id truncated to the first 8 characters.

## Running the App

Run the full stack (server + client) with [`just`](https://github.com/casey/just):

```bash
just start   # server :4000 + client :5173 (foreground, Ctrl+C to stop)
just stop    # stop all processes and clean up
```

- Client dashboard: http://localhost:5173
- Server / events API: http://localhost:4000
- WebSocket stream: ws://localhost:4000/stream

See all recipes with `just --list`.