---
type: "query"
date: "2026-06-03T04:45:58.654117+00:00"
question: "UserPromptSubmit"
contributor: "graphify"
source_nodes: ["UserPromptSubmit hook event", "Hook lifecycle", "PreToolUse", "UserPrompt Expansion (slash commands)"]
---

# Q: UserPromptSubmit

## Answer

Expanded from original query via vocab: [user, prompt, submit]. UserPromptSubmit is a hook event that fires each turn right after the user submits a prompt, before any tool runs. In the lifecycle it sits inside the 'Each Turn' boundary: UserPrompt Expansion (slash commands) precedes it, and it precedes PreToolUse (so it runs before tool execution and the permission check). It is part of the Hook lifecycle (community 2) and is referenced by the security-guidance plugin as one of the hooks usable for review. All source_location are None — the graph stores no line numbers.

## Source Nodes

- UserPromptSubmit hook event
- Hook lifecycle
- PreToolUse
- UserPrompt Expansion (slash commands)