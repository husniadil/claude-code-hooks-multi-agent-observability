---
source_url: https://code.claude.com/docs/en/mcp.md
topic: mcp
relevance: hooks
---

# mcp — hooks-relevant excerpts

> 📄 Full page: https://code.claude.com/docs/en/mcp.md

> Kept: Option 3 local stdio server (CLAUDE_PROJECT_DIR shared with hooks), elicitation→Elicitation hook, MCP tool/prompt naming `mcp__<server>__<tool>` used in hook matchers, channels/push events, headersHelper, plugin MCP env vars.

### Option 3: Add a local stdio server

Stdio servers run as local processes on your machine. They're ideal for tools that need direct system access or custom scripts.

Claude Code sets `CLAUDE_PROJECT_DIR` in the spawned server's environment to the project root, so your server can resolve project-relative paths without depending on the working directory. This is the same directory hooks receive in their `CLAUDE_PROJECT_DIR` variable. Read it from inside your server process, for example `process.env.CLAUDE_PROJECT_DIR` in Node or `os.environ["CLAUDE_PROJECT_DIR"]` in Python. Your server can also call the MCP `roots/list` request, which returns the directory Claude Code was launched from.

This variable is set in the server's environment, not in Claude Code's own environment, so referencing it via `${VAR}` expansion in a project- or user-scoped `.mcp.json` `command` or `args` requires a default such as `${CLAUDE_PROJECT_DIR:-.}`. Plugin-provided MCP configurations substitute `${CLAUDE_PROJECT_DIR}` directly and don't need the default.

```bash theme={null}
# Basic syntax
claude mcp add [options] <name> -- <command> [args...]

# Real example: Add Airtable server
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
  -- npx -y airtable-mcp-server
```

<Note>
  **Important: Option ordering**

  All options (`--transport`, `--env`, `--scope`, `--header`) must come **before** the server name. The `--` (double dash) then separates the server name from the command and arguments that get passed to the MCP server.

  For example:

  * `claude mcp add --transport stdio myserver -- npx server` → runs `npx server`
  * `claude mcp add --transport stdio --env KEY=value myserver -- python server.py --port 8080` → runs `python server.py --port 8080` with `KEY=value` in environment

  This prevents conflicts between Claude's flags and the server's flags.
</Note>

### Push messages with channels

An MCP server can also push messages directly into your session so Claude can react to external events like CI results, monitoring alerts, or chat messages. To enable this, your server declares the `claude/channel` capability and you opt it in with the `--channels` flag at startup. See [Channels](https://code.claude.com/docs/en/channels) to use an officially supported channel, or [Channels reference](https://code.claude.com/docs/en/channels-reference) to build your own.

### Plugin-provided MCP servers (environment variables)

* **Environment variables**: use `${CLAUDE_PLUGIN_ROOT}` for bundled plugin files, `${CLAUDE_PLUGIN_DATA}` for [persistent state](plugins-reference.md#persistent-data-directory) that survives plugin updates, and `${CLAUDE_PROJECT_DIR}` for the stable project root

### Use dynamic headers for custom authentication

If your MCP server uses an authentication scheme other than OAuth (such as Kerberos, short-lived tokens, or an internal SSO), use `headersHelper` to generate request headers at connection time. Claude Code runs the command and merges its output into the connection headers.

```json theme={null}
{
  "mcpServers": {
    "internal-api": {
      "type": "http",
      "url": "https://mcp.internal.example.com",
      "headersHelper": "/opt/bin/get-mcp-auth-headers.sh"
    }
  }
}
```

The command can also be inline:

```json theme={null}
{
  "mcpServers": {
    "internal-api": {
      "type": "http",
      "url": "https://mcp.internal.example.com",
      "headersHelper": "echo '{\"Authorization\": \"Bearer '\"$(get-token)\"'\"}'"
    }
  }
}
```

**Requirements:**

* The command must write a JSON object of string key-value pairs to stdout
* The command runs in a shell with a 10-second timeout
* Dynamic headers override any static `headers` with the same name

The helper runs fresh on each connection (at session start and on reconnect). There is no caching, so your script is responsible for any token reuse.

Claude Code sets these environment variables when executing the helper:

| Variable                      | Value                      |
| :---------------------------- | :------------------------- |
| `CLAUDE_CODE_MCP_SERVER_NAME` | the name of the MCP server |
| `CLAUDE_CODE_MCP_SERVER_URL`  | the URL of the MCP server  |

Use these to write a single helper script that serves multiple MCP servers.

<Note>
  `headersHelper` executes arbitrary shell commands. When defined at project or local scope, it only runs after you accept the workspace trust dialog.
</Note>

## Respond to MCP elicitation requests

MCP servers can request structured input from you mid-task using elicitation. When a server needs information it can't get on its own, Claude Code displays an interactive dialog and passes your response back to the server. No configuration is required on your side: elicitation dialogs appear automatically when a server requests them.

Servers can request input in two ways:

* **Form mode**: Claude Code shows a dialog with form fields defined by the server (for example, a username and password prompt). Fill in the fields and submit.
* **URL mode**: Claude Code opens a browser URL for authentication or approval. Complete the flow in the browser, then confirm in the CLI.

To auto-respond to elicitation requests without showing a dialog, use the [`Elicitation` hook](../hooks.md#elicitation).

If you're building an MCP server that uses elicitation, see the [MCP elicitation specification](https://modelcontextprotocol.io/docs/learn/client-concepts#elicitation) for protocol details and schema examples.

## Use MCP prompts as commands (naming format)

MCP servers can expose prompts that become available as commands in Claude Code.

### Execute MCP prompts

Type `/` to see all available commands, including those from MCP servers. MCP prompts appear with the format `/mcp__servername__promptname`.

Execute a prompt without arguments:

```text theme={null}
/mcp__github__list_prs
```

Execute a prompt with arguments:

```text theme={null}
/mcp__github__pr_review 456
```

```text theme={null}
/mcp__jira__create_issue "Bug in login flow" high
```

Tips:

* MCP prompts are dynamically discovered from connected servers
* Arguments are parsed based on the prompt's defined parameters
* Prompt results are injected directly into the conversation
* Server and prompt names are normalized (spaces become underscores)
