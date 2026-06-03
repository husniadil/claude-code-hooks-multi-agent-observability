---
source_url: https://code.claude.com/docs/en/skills.md
topic: skills
relevance: hooks
---

# skills — hooks-relevant excerpts

> 📄 Full page: https://code.claude.com/docs/en/skills.md

> Kept: defining hooks in skill frontmatter, skills-vs-hooks comparison (skills give instructions, hooks enforce deterministically), plugin skill folders bundling hooks, and live-change-detection notes about `hooks/`.

<Note>
  Add a `.claude-plugin/plugin.json` to a skill folder and it loads as a [plugin](https://code.claude.com/docs/en/plugins-reference#skills-directory-plugins) named `<name>@skills-dir`, so it can bundle agents, hooks, and MCP servers. In a project's `.claude/skills/`, this requires accepting the workspace trust dialog first.
</Note>

#### Live change detection

Claude Code watches skill directories for file changes. Adding, editing, or removing a skill under `~/.claude/skills/`, the project `.claude/skills/`, or a `.claude/skills/` inside an `--add-dir` directory takes effect within the current session without restarting. Creating a top-level skills directory that did not exist when the session started requires restarting Claude Code so the new directory can be watched.

<Note>
  Live change detection covers `SKILL.md` text only. For a skill folder that is also a [plugin](https://code.claude.com/docs/en/plugins-reference#skills-directory-plugins), changes to `hooks/`, `.mcp.json`, `agents/`, and `output-styles/` need `/reload-plugins` to take effect.
</Note>

### Frontmatter reference

`hooks` frontmatter field (from the frontmatter reference table):

| Field    | Required | Description                                                                                                                              |
| :------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| `hooks`  | No       | Hooks scoped to this skill's lifecycle. See [Hooks in skills and agents](../hooks.md#hooks-in-skills-and-agents) for configuration format. |

### Skill content lifecycle

If a skill seems to stop influencing behavior after the first response, the content is usually still present and the model is choosing other tools or approaches. Strengthen the skill's `description` and instructions so the model keeps preferring it, or use [hooks](../hooks.md) to enforce behavior deterministically. If the skill is large or you invoked several others after it, re-invoke it after compaction to restore the full content.

## Related resources

* **[Hooks](../hooks.md)**: automate workflows around tool events
