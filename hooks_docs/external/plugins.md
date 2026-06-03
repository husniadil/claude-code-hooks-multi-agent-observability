---
source_url: https://code.claude.com/docs/en/plugins.md
topic: plugins
relevance: hooks
---

# plugins — hooks-relevant excerpts

> 📄 Full page: https://code.claude.com/docs/en/plugins.md

> Kept: how plugins bundle/enable hooks (hooks/hooks.json), standalone-vs-plugin hooks tradeoff, plugin structure hooks row, reload behavior, and the migrate-hooks-to-a-plugin steps with verbatim hooks.json example.

Plugins let you extend Claude Code with custom functionality that can be shared across projects and teams. This guide covers creating your own plugins with skills, agents, hooks, and MCP servers.

## When to use plugins vs standalone configuration

Claude Code supports two ways to add custom skills, agents, and hooks:

| Approach                                                    | Skill names          | Best for                                                                                        |
| :---------------------------------------------------------- | :------------------- | :---------------------------------------------------------------------------------------------- |
| **Standalone** (`.claude/` directory)                       | `/hello`             | Personal workflows, project-specific customizations, quick experiments                          |
| **Plugins** (directories with `.claude-plugin/plugin.json`) | `/plugin-name:hello` | Sharing with teammates, distributing to community, versioned releases, reusable across projects |

**Use standalone configuration when**:

* You're experimenting with skills or hooks before packaging them

**Use plugins when**:

* You want to share functionality (including hooks) with your team or community
* You need the same skills/agents across multiple projects

## Plugin structure overview

Plugins can include much more than skills: custom agents, hooks, MCP servers, LSP servers, and background monitors.

> **Common mistake**: Don't put `commands/`, `agents/`, `skills/`, or `hooks/` inside the `.claude-plugin/` directory. Only `plugin.json` goes inside `.claude-plugin/`. All other directories must be at the plugin root level.

| Directory         | Location    | Purpose                                                                        |
| :---------------- | :---------- | :----------------------------------------------------------------------------- |
| `.claude-plugin/` | Plugin root | Contains `plugin.json` manifest (optional if components use default locations) |
| `hooks/`          | Plugin root | Event handlers in `hooks.json`                                                 |
| `settings.json`   | Plugin root | Default [settings](settings.md) applied when the plugin is enabled            |

## Develop more complex plugins

### Test your plugins locally

Use the `--plugin-dir` flag to test plugins during development. This loads your plugin directly without requiring installation.

```bash theme={null}
claude --plugin-dir ./my-plugin
```

As you make changes to your plugin, run `/reload-plugins` to pick up the updates without restarting. This reloads plugins, skills, agents, hooks, plugin MCP servers, and plugin LSP servers. Test your plugin components:

* Verify hooks work as expected

### Debug plugin issues

If your plugin isn't working as expected:

1. **Check the structure**: Ensure your directories are at the plugin root, not inside `.claude-plugin/`
2. **Test components individually**: Check each skill, agent, and hook separately
3. **Use validation and debugging tools**: See [Debugging and development tools](https://code.claude.com/docs/en/plugins-reference#debugging-and-development-tools) for CLI commands and troubleshooting techniques

## Convert existing configurations to plugins

If you already have skills or hooks in your `.claude/` directory, you can convert them into a plugin for easier sharing and distribution.

### Migration steps

**Migrate hooks**:

If you have hooks in your settings, create a hooks directory:

```bash theme={null}
mkdir my-plugin/hooks
```

Create `my-plugin/hooks/hooks.json` with your hooks configuration. Copy the `hooks` object from your `.claude/settings.json` or `settings.local.json`, since the format is the same. The command receives hook input as JSON on stdin, so use `jq` to extract the file path:

```json my-plugin/hooks/hooks.json theme={null}
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npm run lint:fix" }]
      }
    ]
  }
}
```

**Test your migrated plugin**: Load your plugin with `claude --plugin-dir ./my-plugin` and verify hooks trigger correctly.

### What changes when migrating (hook-relevant rows)

| Standalone (`.claude/`)       | Plugin                           |
| :---------------------------- | :------------------------------- |
| Hooks in `settings.json`      | Hooks in `hooks/hooks.json`      |
| Must manually copy to share   | Install with `/plugin install`   |

> After migrating, you can remove the original files from `.claude/` to avoid duplicates. The plugin version will take precedence when loaded.

## Next steps

* [Hooks](../hooks.md): event handling and automation
