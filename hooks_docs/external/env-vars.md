---
source_url: https://code.claude.com/docs/en/env-vars.md
topic: env-vars
relevance: hooks
---

# env-vars — hooks-relevant excerpts

> 📄 Full page: https://code.claude.com/docs/en/env-vars.md

> Kept: how to set env vars (shell + `env` key in settings), precedence rules, and every variable a hook author uses, that is set in hook subprocesses, that affects hook discovery/timeouts/block-caps, or that debugs hooks. Note: `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`, and `CLAUDE_ENV_FILE`-style hook-input vars beyond `CLAUDE_ENV_FILE` are NOT present in this page's table.

## Set environment variables

A variable you set in your shell lasts for that terminal session, while a variable in a settings file applies every time `claude` runs.

### In your shell

Set the variable before launching `claude`:

```bash
export API_TIMEOUT_MS="1200000"
claude
```

To set it for every session, add the `export` line to `~/.bashrc`, `~/.zshrc`, or your shell's profile file.

(Windows PowerShell: `$env:API_TIMEOUT_MS = "1200000"`; persist with `[Environment]::SetEnvironmentVariable("API_TIMEOUT_MS", "1200000", "User")`. Windows CMD: `set API_TIMEOUT_MS=1200000`; persist with `setx API_TIMEOUT_MS "1200000"`.)

### In settings files

Add variables under the `env` key in a `settings.json` file. Claude Code reads them directly from the file at startup, so they take effect no matter how `claude` was launched.

```json ~/.claude/settings.json
{
  "env": {
    "API_TIMEOUT_MS": "1200000",
    "BASH_DEFAULT_TIMEOUT_MS": "300000"
  }
}
```

The file you choose controls who the variables apply to:

| File                          | Applies to                                                   |
| :---------------------------- | :----------------------------------------------------------- |
| `~/.claude/settings.json`     | You, in every project                                        |
| `.claude/settings.json`       | Everyone working in the project, checked into source control |
| `.claude/settings.local.json` | You, in this project only, not checked in                    |
| Managed settings              | Everyone in your organization, deployed by an admin          |

## Precedence

Where the same behavior has both an environment variable and a settings field, the environment variable takes precedence. For example, `ANTHROPIC_MODEL` overrides the `model` setting, and `CLAUDE_CODE_AUTO_CONNECT_IDE` overrides `autoConnectIde`. The settings field applies when the environment variable is not set.

How an environment variable interacts with CLI flags and in-session commands varies per feature: `--model` and `/model` override `ANTHROPIC_MODEL`, while `CLAUDE_CODE_EFFORT_LEVEL` overrides `/effort`. When a variable interacts with another configuration source, its row in the Variables list states the precedence or links to the page that documents it.

Claude Code reads environment variables at startup, so changes take effect the next time you launch `claude`.

## Variables (hooks-relevant rows)

| Variable                                                | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| :------------------------------------------------------ | :--- |
| `CLAUDECODE`                                            | Set to `1` in subprocesses Claude Code spawns (Bash and PowerShell tools, tmux sessions, [hook](../hooks.md) commands, [status line](statusline.md) commands, stdio [MCP server](mcp.md) subprocesses). Use to detect when a script is running inside a subprocess spawned by Claude Code                                                                                                                                                                                                                                                                                                                                                                   |
| `CLAUDE_CODE_DEBUG_LOGS_DIR`                            | Override the debug log file path. Despite the name, this is a file path, not a directory. Requires debug mode to be enabled separately via `--debug`, `/debug`, or the `DEBUG` environment variable: setting this variable alone does not enable logging. The [`--debug-file`](https://code.claude.com/docs/en/cli-reference#cli-flags) flag does both at once. Defaults to `~/.claude/debug/<session-id>.txt`                                                                                                                                                                                                                                                                          |
| `CLAUDE_CODE_DEBUG_LOG_LEVEL`                           | Minimum log level written to the debug log file. Values: `verbose`, `debug` (default), `info`, `warn`, `error`. Set to `verbose` to include high-volume diagnostics like full status line command output, or raise to `error` to reduce noise                                                                                                                                                                                                                                                                                                                                                                                                               |
| `CLAUDE_CODE_NEW_INIT`                                  | Set to `1` to make `/init` run an interactive setup flow. The flow asks which files to generate, including CLAUDE.md, skills, and hooks, before exploring the codebase and writing them. Without this variable, `/init` generates a CLAUDE.md automatically without prompting.                                                                                                                                                                                                                                                                                                                                                                              |
| `CLAUDE_CODE_POWERSHELL_RESPECT_EXECUTION_POLICY`       | Set to `1` to stop Claude Code from passing `-ExecutionPolicy Bypass` when spawning PowerShell for tool calls, hooks, and status line commands, and respect the machine's effective execution policy instead. By default Claude Code bypasses execution policy at process scope so `.ps1` scripts and module imports work on default-Restricted Windows installs. Process-scope bypass never overrides Group Policy `MachinePolicy` or `UserPolicy` regardless of this setting                                                                                                                                                                              |
| `CLAUDE_CODE_PROPAGATE_TRACEPARENT`                     | {/* min-version: 2.1.152 */}Set to `1` to propagate W3C trace context when `ANTHROPIC_BASE_URL` points at a custom proxy. Propagation covers the `traceparent` header on model and HTTP MCP requests and the `TRACEPARENT` environment variable for Bash, PowerShell, and hook subprocesses. By default, propagation is enabled only when connected directly to the Anthropic API. See [Traces (beta)](https://code.claude.com/docs/en/monitoring-usage#traces-beta)                                                                                                                                                                                                                    |
| `CLAUDE_CODE_REMOTE`                                    | Set automatically to `true` when Claude Code is running as a [cloud session](https://code.claude.com/docs/en/claude-code-on-the-web). Read this from a hook or setup script to detect whether you are in a cloud environment                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `CLAUDE_CODE_SCRIPT_CAPS`                               | JSON object limiting how many times specific scripts may be invoked per session when `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` is set. Keys are substrings matched against the command text; values are integer call limits. For example, `{"deploy.sh": 2}` allows `deploy.sh` to be called at most twice. Matching is substring-based so shell-expansion tricks like `./scripts/deploy.sh $(evil)` still count against the cap. Runtime fan-out via `xargs` or `find -exec` is not detected; this is a defense-in-depth control                                                                                                                                  |
| `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`               | Override the time budget in milliseconds for [SessionEnd](../hooks.md#sessionend) hooks. Applies to session exit, `/clear`, and switching sessions via interactive `/resume`. By default the budget is 1.5 seconds, automatically raised to the highest per-hook `timeout` configured in settings files, up to 60 seconds. Timeouts on plugin-provided hooks do not raise the budget                                                                                                                                                                                                                                                                          |
| `CLAUDE_CODE_SESSION_ID`                                | Set automatically to the current session ID in Bash and PowerShell tool subprocesses, [hook command](../hooks.md) subprocesses, and stdio [MCP server](mcp.md) subprocesses. For Bash, PowerShell, and hooks this matches the `session_id` field in the hook JSON input and is updated on `/clear`. An MCP server subprocess retains the ID it was spawned with, and may receive the initial startup ID rather than the resumed ID when launched via `--resume` or `--continue`. Use to correlate scripts and external tools with the Claude Code session that launched them                                                                                 |
| `CLAUDE_CODE_SHELL_PREFIX`                              | Command prefix that wraps shell commands Claude Code spawns: Bash tool calls, [hook](../hooks.md) commands, and stdio [MCP server](mcp.md) startup commands. Useful for logging or auditing. Example: setting `/path/to/logger.sh` runs each command as `/path/to/logger.sh <command>`                                                                                                                                                                                                                                                                                                                                                                       |
| `CLAUDE_CODE_SIMPLE`                                    | Set to `1` to run with a minimal system prompt and only the Bash, file read, and file edit tools. MCP tools from `--mcp-config` are still available. Disables auto-discovery of hooks, skills, plugins, MCP servers, auto memory, and CLAUDE.md. OAuth tokens and keychain credentials are not read, so Anthropic authentication must come from `ANTHROPIC_API_KEY` or an `apiKeyHelper` in `--settings`. Equivalent to passing [`--bare`](headless.md#start-faster-with-bare-mode)                                                                                                                                                                        |
| `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT`                      | Set to `1` to use a shorter system prompt and abbreviated tool descriptions on any model. Set to `0`, `false`, `no`, or `off` to opt out even on models where the experiment or server configuration would otherwise enable it. The full tool set, hooks, MCP servers, and CLAUDE.md discovery remain enabled                                                                                                                                                                                                                                                                                                                                               |
| `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`                       | Maximum number of consecutive times a [Stop](../hooks.md#stop) or [SubagentStop](../hooks.md#subagentstop) hook may block the turn from ending before Claude Code overrides it and ends the turn anyway (default: 8). Set to `0` to disable the cap. Raise this if your hook legitimately needs more iterations to resolve                                                                                                                                                                                                                                                                                                                                      |
| `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`                      | Set to `1` to strip Anthropic and cloud provider credentials from subprocess environments (Bash tool, hooks, MCP stdio servers). The parent Claude process keeps these credentials for API calls, but child processes cannot read them, reducing exposure to prompt injection attacks that attempt to exfiltrate secrets via shell expansion. On Linux, this also runs Bash subprocesses in an isolated PID namespace so they cannot read host process environments via `/proc`; as a side effect, `ps`, `pgrep`, and `kill` cannot see or signal host processes. `claude-code-action` sets this automatically when `allowed_non_write_users` is configured |
| `CLAUDE_EFFORT`                                         | Set automatically in Bash tool subprocesses and hook commands to the active [effort level](model-config.md#adjust-effort-level) for the turn: `low`, `medium`, `high`, `xhigh`, or `max`. Ultracode is not a distinct level and reports as `xhigh`. Matches the `effort.level` field passed to [hooks](../hooks.md). Only set when the current model supports the effort parameter                                                                                                                                                                                                                                                                           |
| `CLAUDE_ENV_FILE`                                       | Path to a shell script whose contents Claude Code runs before each Bash command in the same shell process, so exports in the file are visible to the command. Use to persist virtualenv or conda activation across commands. Also populated dynamically by [SessionStart](../hooks.md#persist-environment-variables), [Setup](../hooks.md#setup), [CwdChanged](../hooks.md#cwdchanged), and [FileChanged](../hooks.md#filechanged) hooks                                                                                                                                                                                                                            |
| `DEBUG`                                                 | Set to `1` to enable debug mode, equivalent to launching with [`--debug`](https://code.claude.com/docs/en/cli-reference#cli-flags). Debug logs are written to `~/.claude/debug/<session-id>.txt`, or to the path set by `CLAUDE_CODE_DEBUG_LOGS_DIR`. Only the truthy values `1`, `true`, `yes`, and `on` enable debug mode, so namespace patterns like `DEBUG=express:*` set for other tools do not trigger it                                                                                                                                                                                                                                                                         |

### Note on commonly-expected hook variables

`CLAUDE_PROJECT_DIR` and `CLAUDE_PLUGIN_ROOT` (often referenced by hook commands and plugin-provided hooks) are **not documented in this env-vars page's table**. Look for them in the hooks reference / plugins reference pages instead. The only hook-input-mirroring variables present here are `CLAUDE_CODE_SESSION_ID` (mirrors `session_id`) and `CLAUDE_EFFORT` (mirrors `effort.level`).
