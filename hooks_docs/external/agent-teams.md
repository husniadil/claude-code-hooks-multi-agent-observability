---
source_url: https://code.claude.com/docs/en/agent-teams.md
topic: agent-teams
relevance: hooks
---

# agent-teams — hooks-relevant excerpts

> 📄 Full page: https://code.claude.com/docs/en/agent-teams.md

> Kept: the "Enforce quality gates with hooks" section (TeammateIdle/TaskCreated/TaskCompleted), plus the lifecycle states/events those hooks fire on (task states, idle notifications, members array agent_type) and subagent-definition-as-teammate behavior.

## Assign and claim tasks

The shared task list coordinates work across the team. The lead creates tasks and teammates work through them. Tasks have three states: pending, in progress, and completed. Tasks can also depend on other tasks: a pending task with unresolved dependencies cannot be claimed until those dependencies are completed.

The lead can assign tasks explicitly, or teammates can self-claim:

* **Lead assigns**: tell the lead which task to give to which teammate
* **Self-claim**: after finishing a task, a teammate picks up the next unassigned, unblocked task on its own

Task claiming uses file locking to prevent race conditions when multiple teammates try to claim the same task simultaneously.

## Enforce quality gates with hooks

Use [hooks](../hooks.md) to enforce rules when teammates finish work or tasks are created or completed:

* [`TeammateIdle`](../hooks.md#teammateidle): runs when a teammate is about to go idle. Exit with code 2 to send feedback and keep the teammate working.
* [`TaskCreated`](../hooks.md#taskcreated): runs when a task is being created. Exit with code 2 to prevent creation and send feedback.
* [`TaskCompleted`](../hooks.md#taskcompleted): runs when a task is being marked complete. Exit with code 2 to prevent completion and send feedback.

## Architecture (lifecycle state hooks fire on)

The team config contains a `members` array with each teammate's name, agent ID, and agent type. Teammates can read this file to discover other team members.

## Use subagent definitions for teammates

When spawning a teammate, you can reference a [subagent](sub-agents.md) type from any [subagent scope](sub-agents.md#choose-the-subagent-scope): project, user, plugin, or CLI-defined. This lets you define a role once, such as a security-reviewer or test-runner, and reuse it both as a delegated subagent and as an agent team teammate.

To use a subagent definition, mention it by name when asking Claude to spawn the teammate:

```text theme={null}
Spawn a teammate using the security-reviewer agent type to audit the auth module.
```

The teammate honors that definition's `tools` allowlist and `model`, and the definition's body is appended to the teammate's system prompt as additional instructions rather than replacing it. Team coordination tools such as `SendMessage` and the task management tools are always available to a teammate even when `tools` restricts other tools.

<Note>
  The `skills` and `mcpServers` frontmatter fields in a subagent definition are not applied when that definition runs as a teammate. Teammates load skills and MCP servers from your project and user settings, the same as a regular session.
</Note>

## Context and communication (idle notifications hooks fire on)

**How teammates share information:**

* **Automatic message delivery**: when teammates send messages, they're delivered automatically to recipients. The lead doesn't need to poll for updates.
* **Idle notifications**: when a teammate finishes and stops, they automatically notify the lead.
* **Shared task list**: all agents can see task status and claim available work.
* **Teammate messaging**: send a message to one specific teammate by name. To reach everyone, send one message per recipient.
