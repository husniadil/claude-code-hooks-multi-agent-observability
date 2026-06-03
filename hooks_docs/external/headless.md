---
source_url: https://code.claude.com/docs/en/headless.md
topic: headless
relevance: hooks
---

# headless — hooks-relevant excerpts

> 📄 Full page: https://code.claude.com/docs/en/headless.md

> Kept: how `-p` / `--bare` mode affects hook auto-discovery and execution (a teammate's `~/.claude` hook won't run in bare mode), tool auto-approval / permission modes in non-interactive runs (which govern whether permission-related prompts fire), and stream-json `system/init` reporting (the closest non-interactive signal to hook/plugin load state). The headless page does not separately document PreToolUse vs PermissionRequest hook firing.

## Basic usage

To run Claude Code in non-interactive mode, pass `-p` with your prompt and any [CLI options](https://code.claude.com/docs/en/cli-reference):

```bash
claude -p "Find and fix the bug in auth.py" --allowedTools "Read,Edit,Bash"
```

All [CLI options](https://code.claude.com/docs/en/cli-reference) work with `-p`.

## Start faster with bare mode

Add `--bare` to reduce startup time by skipping auto-discovery of hooks, skills, plugins, MCP servers, auto memory, and CLAUDE.md. Without it, `claude -p` loads the same [context](https://code.claude.com/docs/en/how-claude-code-works#the-context-window) an interactive session would, including anything configured in the working directory or `~/.claude`.

Bare mode is useful for CI and scripts where you need the same result on every machine. **A hook in a teammate's `~/.claude` or an MCP server in the project's `.mcp.json` won't run, because bare mode never reads them. Only flags you pass explicitly take effect.**

This example runs a one-off summarize task in bare mode and pre-approves the Read tool so the call completes without a permission prompt:

```bash
claude --bare -p "Summarize this file" --allowedTools "Read"
```

In bare mode Claude has access to the Bash, file read, and file edit tools. Pass any context you need with a flag:

| To load                 | Use                                                     |
| ----------------------- | ------------------------------------------------------- |
| System prompt additions | `--append-system-prompt`, `--append-system-prompt-file` |
| Settings                | `--settings <file-or-json>`                             |
| MCP servers             | `--mcp-config <file-or-json>`                           |
| Custom agents           | `--agents <json>`                                       |
| A plugin                | `--plugin-dir <path>`, `--plugin-url <url>`             |

Bare mode skips OAuth and keychain reads. Anthropic authentication must come from `ANTHROPIC_API_KEY` or an `apiKeyHelper` in the JSON passed to `--settings`. Bedrock, Vertex, and Foundry use their usual provider credentials.

> `--bare` is the recommended mode for scripted and SDK calls, and will become the default for `-p` in a future release.

> For CI and other scripted calls, add `--bare` so they don't pick up whatever happens to be configured locally (including locally-configured hooks).

## Auto-approve tools (permission behavior in `-p` mode)

Use `--allowedTools` to let Claude use certain tools without prompting:

```bash
claude -p "Run the test suite and fix any failures" \
  --allowedTools "Bash,Read,Edit"
```

To set a baseline for the whole session instead of listing individual tools, pass a [permission mode](permission-modes.md). `dontAsk` denies anything not in your `permissions.allow` rules or the [read-only command set](permissions.md#read-only-commands), which is useful for locked-down CI runs. `acceptEdits` lets Claude write files without prompting and also auto-approves common filesystem commands such as `mkdir`, `touch`, `mv`, and `cp`. Other shell commands and network requests still need an `--allowedTools` entry or a `permissions.allow` rule, otherwise the run aborts when one is attempted:

```bash
claude -p "Apply the lint fixes" --permission-mode acceptEdits
```

The `--allowedTools` flag uses [permission rule syntax](settings.md#permission-rule-syntax). The trailing ` *` enables prefix matching, so `Bash(git diff *)` allows any command starting with `git diff`. The space before `*` is important: without it, `Bash(git diff*)` would also match `git diff-index`.

## system/init event (plugin/hook load state)

The `system/init` event reports session metadata including the model, tools, MCP servers, and loaded plugins. It is the first event in the stream unless [`CLAUDE_CODE_SYNC_PLUGIN_INSTALL`](env-vars.md) is set, in which case `plugin_install` events precede it. Use the plugin fields to fail CI when a plugin did not load (relevant because plugins can provide hooks):

| Field           | Type  | Description                                                                                                                                                                                                                                                                                  |
| --------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugins`       | array | plugins that loaded successfully, each with `name` and `path`                                                                                                                                                                                                                                |
| `plugin_errors` | array | plugin load-time errors, each with `plugin`, `type`, and `message`. Includes unsatisfied dependency versions and `--plugin-dir` load failures such as a missing path or invalid archive. Affected plugins are demoted and absent from `plugins`. The key is omitted when there are no errors |

When [`CLAUDE_CODE_SYNC_PLUGIN_INSTALL`](env-vars.md) is set, Claude Code emits `system/plugin_install` events while marketplace plugins install before the first turn.
