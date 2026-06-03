---
source_url: https://code.claude.com/docs/en/debug-your-config.md
topic: debug-your-config
relevance: hooks
---

# debug-your-config — hooks-relevant excerpts

> 📄 Full page: https://code.claude.com/docs/en/debug-your-config.md

> Kept: how to debug why a hook does/doesn't fire — `/hooks` menu, `/debug`, `/doctor`, `claude --debug hooks`, the debug log, clean-config test, and the common-causes table rows for hooks.

> Diagnose why CLAUDE.md, settings, hooks, MCP servers, or skills aren't taking effect. Use /context, /doctor, /hooks, and /mcp to see what actually loaded.

When Claude ignores an instruction or a feature you configured doesn't appear, the cause is usually that the file didn't load, it loaded from a different location than you expected, or another file overrode it. This guide shows how to inspect what Claude Code actually loaded so you can narrow down which applies.

## See what loaded into context

The `/context` command shows everything occupying the context window for the current session, broken down by category: system prompt, memory files, skills, MCP tools, and conversation messages.

For detail on a specific category, follow up with the dedicated command:

| Command          | Shows                                                                                                        |
| :--------------- | :----------------------------------------------------------------------------------------------------------- |
| `/hooks`         | Active hook configurations                                                                                   |
| `/doctor`        | Configuration diagnostics: invalid keys, schema errors, installation health                                  |
| `/debug [issue]` | Enables debug logging for the session and prompts Claude to diagnose using the log output and settings paths |
| `/status`        | Active settings sources, including whether managed settings are in effect                                    |

<Note>
  CLAUDE.md and permissions solve different problems. CLAUDE.md tells Claude how your project works so it makes good decisions. [Permissions](permissions.md) and [hooks](../hooks.md) enforce limits regardless of what Claude decides. Use CLAUDE.md for "we do it this way here." Use permissions or hooks for security boundaries and anything that must never happen, where you need a guarantee instead of guidance.
</Note>

## Check resolved settings

Settings merge across managed, user, project, and local scopes. Managed settings always win when present. Among the rest, the closer scope overrides the broader one in the order local, then project, then user. Some settings can also be set by command-line flags or [environment variables](env-vars.md), which act as another override layer. When a setting doesn't seem to apply, the value you set is usually being overridden by another scope or an environment variable.

Run `/doctor` to validate your configuration files and surface invalid keys or schema errors. When `/doctor` reports issues, press `f` to send the diagnostic report to Claude and have it walk through fixes with you.

Run `/status` to see which settings sources are active, including whether managed settings are in effect. To understand which scope wins for a given key, see [How scopes interact](settings.md#how-scopes-interact).

## Check hooks

Run `/hooks` to list every hook registered for the current session, grouped by event. If a hook you defined doesn't appear, it isn't being read: hooks go under the `"hooks"` key in a settings file, not in a standalone file.

If the hook appears but doesn't fire, the matcher is the usual cause. The `matcher` field is a single string that uses `|` to match multiple tool names, for example `"Edit|Write"`. A misspelled tool name fails silently because the matcher never matches. An array value is a schema error: Claude Code shows a settings error notice, `/doctor` reports the validation failure, and the hook entry is dropped so it won't appear in `/hooks`.

Edits to `settings.json` take effect in the running session after a brief file-stability delay. You don't need to restart. If `/hooks` still shows the old definition a few seconds after saving, run `/hooks` again to refresh the view.

If `/hooks` shows the hook but it still does not fire, the next step is to watch hook evaluation live. Start a session with `claude --debug hooks` and trigger the tool call. The debug log records each event, which matchers were checked, and the hook's exit code and output. See [Debug hooks](../hooks.md#debug-hooks) for the log format and [hooks troubleshooting](../hooks-guide.md#limitations-and-troubleshooting) for common failure patterns.

## Test against a clean configuration

If targeted checks don't isolate the cause, or your configuration is in an unknown state, compare against a session that loads nothing from your usual setup. Point [`CLAUDE_CONFIG_DIR`](env-vars.md) at an empty directory to bypass everything under `~/.claude`, and launch from a directory that has no `.claude` folder, `.mcp.json`, or `CLAUDE.md` so project configuration is also skipped.

```bash theme={null}
cd /tmp && CLAUDE_CONFIG_DIR=/tmp/claude-clean claude
```

The clean session has no user or project settings, hooks, MCP servers, plugins, or memory.

* Managed settings still apply if your organization deploys them, since they live at a system path outside `~/.claude`
* On Linux and Windows, you'll be prompted to log in again because credentials are stored under the configuration directory
* On macOS, credentials are in the Keychain and carry over to the clean session

If the problem disappears here, the cause is somewhere in your real `~/.claude` or project `.claude` files. Reintroduce them one at a time, by copying files into the temporary directory or by launching from your project, to find which one. If it persists in the clean session, the cause is outside your user and project configuration. Run `/status` to check whether managed settings are in effect, look for [environment variables](env-vars.md) that affect Claude Code, then see [Troubleshooting](https://code.claude.com/docs/en/troubleshooting).

## Check common causes

Hooks-relevant rows from the common-causes table:

| Symptom                                                              | Cause                                                                                                                      | Fix                                                                                                                                                                                                                                                          |
| :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hook never fires                                                     | `matcher` is a JSON array instead of a string                                                                              | Use a single string with `\|` to match multiple tools, for example `"Edit\|Write"`. See [matcher patterns](../hooks.md#matcher-patterns).                                                                                                                      |
| Hook never fires                                                     | `matcher` value is lowercase, for example `"bash"`                                                                         | Matching is case-sensitive. Tool names are capitalized: `Bash`, `Edit`, `Write`, `Read`.                                                                                                                                                                     |
| Hook never fires                                                     | Hooks are defined in a standalone file instead of `settings.json`                                                          | There is no standalone hooks file for project or user config. Define hooks under the `"hooks"` key in `settings.json`. Only [plugins](plugins-reference.md#hooks) load a separate `hooks/hooks.json`. See [hook configuration](../hooks.md).                  |
| Permissions, hooks, or env set globally are ignored                  | Configuration was added to `~/.claude.json`                                                                                | `~/.claude.json` holds app state and UI toggles. `permissions`, `hooks`, and `env` belong in `~/.claude/settings.json`. These are two different files.                                                                                                       |
| A `settings.json` value seems ignored                                | The same key is set in `settings.local.json`                                                                               | `settings.local.json` overrides `settings.json`, and both override `~/.claude/settings.json`. See [settings precedence](settings.md#how-scopes-interact).                                                                                                   |
| Cleanup logic never runs at session end                              | No `SessionEnd` hook configured                                                                                            | Add a `SessionEnd` hook in `settings.json`. See the [hook events list](../hooks.md#hook-events).                                                                                                                                                               |
| `Bash(rm *)` deny rule doesn't block `/bin/rm` or `find -delete`     | Prefix rules match the literal command string, not the underlying executable                                               | Add explicit patterns for each variant, or use a [PreToolUse hook](../hooks-guide.md) or the [sandbox](https://code.claude.com/docs/en/sandboxing) for a hard guarantee.                                                                                                                   |

## Related resources

* **[Hooks reference](../hooks.md)**: event names, payloads, and `--debug hooks` output format
