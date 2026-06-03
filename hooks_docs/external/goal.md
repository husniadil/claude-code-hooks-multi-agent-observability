---
source_url: https://code.claude.com/docs/en/goal.md
topic: goal
relevance: hooks
---

# goal — hooks-relevant excerpts

> 📄 Full page: https://code.claude.com/docs/en/goal.md

> Kept: `/goal` is implemented as a session-scoped prompt-based Stop hook; how it compares to a manual Stop hook; how evaluation works via the hooks system; and the hook-related disable settings (`disableAllHooks`, `allowManagedHooksOnly`) that make `/goal` unavailable.

## Compare to other autonomous workflows

Three approaches keep the current session running between prompts. Pick based on what should start the next turn:

| Approach                                                            | Next turn starts when      | Stops when                                      |
| :------------------------------------------------------------------ | :------------------------- | :---------------------------------------------- |
| `/goal`                                                             | The previous turn finishes | A model confirms the condition is met           |
| [`/loop`](https://code.claude.com/docs/en/scheduled-tasks#run-a-prompt-repeatedly-with-%2Floop) | A time interval elapses    | You stop it, or Claude decides the work is done |
| [Stop hook](../hooks-guide.md#prompt-based-hooks)                     | The previous turn finishes | Your own script or prompt decides               |

`/goal` and a Stop hook both fire after every turn. `/goal` is a session-scoped shortcut: you type a condition and it's active for the current session only. A Stop hook lives in your settings file, applies to every session in its scope, and can run a script for deterministic checks or a prompt for model-evaluated ones.

[Auto mode](https://code.claude.com/docs/en/auto-mode-config) on its own approves tool calls within a single turn but doesn't start a new one. Claude stops when it judges the work done. `/goal` adds a separate evaluator that checks your condition after every turn, so completion is decided by a fresh model rather than the one doing the work. The two are complementary: auto mode removes per-tool prompts, and `/goal` removes per-turn prompts.

## How evaluation works

`/goal` is a wrapper around a session-scoped [prompt-based Stop hook](../hooks.md#prompt-based-hooks). Each time Claude finishes a turn, the condition and the conversation so far are sent to your configured [small fast model](model-config.md), which defaults to Haiku. The model returns a yes-or-no decision and a short reason. A "no" tells Claude to keep working and includes the reason as guidance for the next turn. A "yes" clears the goal and records an achieved entry in the transcript.

The evaluator runs on whichever provider your session is configured for. It does not call tools, so it can only judge what Claude has already surfaced in the conversation.

> Evaluation tokens are billed on the small fast model configured for your provider and are typically negligible compared to main-turn spend.

## Requirements

`/goal` runs only in workspaces where you have accepted the trust dialog, because the evaluator is part of the hooks system. `/goal` is also unavailable when [`disableAllHooks`](../hooks.md#disable-or-remove-hooks) is set at any settings level or when [`allowManagedHooksOnly`](settings.md#hook-configuration) is set in managed settings. In each case, the command tells you why instead of silently doing nothing.

## See also (hook-relevant)

* [Prompt-based hooks](../hooks-guide.md#prompt-based-hooks): write your own Stop hook when you need custom evaluation logic

## Note on non-interactive use

`/goal` works in [non-interactive mode](headless.md). Setting a goal with `-p` runs the loop (i.e. the Stop-hook evaluation each turn) to completion in a single invocation:

```bash
claude -p "/goal CHANGELOG.md has an entry for every PR merged this week"
```
