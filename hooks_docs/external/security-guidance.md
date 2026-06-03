---
source_url: https://code.claude.com/docs/en/security-guidance.md
topic: security-guidance
relevance: hooks
---

# security-guidance — hooks-relevant excerpts

> 📄 Full page: https://code.claude.com/docs/en/security-guidance.md

> Kept: how the plugin is built entirely on hooks (the SessionStart/UserPromptSubmit/PostToolUse/Stop event table), how each hook runs a model review and feeds findings back to the session, review independence, the per-edit pattern check schema, and the "pair with a hook that blocks the edit" enforcement note.

## What the plugin checks

The plugin reviews Claude's work at three points, each at a different depth:

* [On each file edit](#on-each-file-edit): a fast pattern match for risky calls, with no model call
* [At the end of each turn](#at-the-end-of-each-turn): a background model review of everything that turn changed
* [On each commit or push Claude makes](#on-each-commit-or-push-claude-makes): a deeper agentic review that reads surrounding code

You can extend each layer by [adding your own rules](#add-your-own-rules). Built-in checks cannot be removed individually, but you can [disable each layer](https://code.claude.com/docs/en/security-guidance#disable-or-uninstall) independently.

### On each file edit

When Claude writes to a file, the plugin scans the new content for known risky patterns. This is a pattern match with no model call, so it adds no usage cost.

Example pattern categories:

* Dynamic code execution: `eval(`, `new Function`, `os.system`, `child_process.exec`
* Unsafe deserialization: `pickle`
* DOM injection: `dangerouslySetInnerHTML`, `.innerHTML =`, `document.write`
* Workflow files: edits under `.github/workflows/`, which can grant repository-level permissions

The check runs after the edit lands and appends the warning to Claude's context for the next step. Each warning fires once per pattern per file per session, so repeat matches in the same file do not flood the conversation.

You can [add your own patterns](#add-custom-per-edit-patterns) to this layer with a `security-patterns.yaml` file.

### At the end of each turn

A turn is one round of Claude responding: you send a message, Claude works and replies, and the turn ends. After each turn, the plugin computes a git diff of everything that changed in the working tree during the turn, including changes from Claude's edit tools, Bash commands, and subagents, and sends it to a separate Claude review focused on security. The review runs in the background, so Claude's reply is not delayed. If the review finds issues, Claude is re-prompted with the findings and addresses them as a follow-up.

This catches issues a string match cannot, such as:

* Authorization bypass
* Insecure direct object references
* Injection
* Server-side request forgery
* Weak cryptography

You see both the finding and Claude's resolution directly in your session. The review covers up to 30 changed files per turn and fires at most three times in a row before yielding back to you.

### On each commit or push Claude makes

When Claude runs `git commit` or `git push` through its Bash tool, the plugin runs a deeper agentic review of the change in the background. This review reads surrounding code, including callers, sanitizers, and related files, to decide whether a finding is real before reporting it. The extra context keeps false positives low on patterns that look dangerous in isolation but are safe in your codebase.

This layer fires only on commits and pushes Claude makes through its Bash tool. Commits you run from your own shell, including the `!` shell escape inside a session, are not reviewed. Commit and push reviews are capped at 20 per rolling hour. If the commit review's findings duplicate what the end-of-turn review already reported, Claude is not re-prompted, so a clean commit produces no visible output from this layer.

### Review independence and limits

The plugin does not ask the same Claude instance that wrote the code to grade itself. The per-edit check is a deterministic string match with no model involved. The end-of-turn and commit reviews run as a separate Claude call with a fresh context and a security-focused prompt: the reviewer starts from the diff, has no investment in the original approach, and is instructed only to find problems.

None of the layers block writes or commits. Findings reach the writing Claude as instructions, Claude addresses them in the conversation, and the review model can miss issues. Treat the plugin as one layer of defense in depth, not a complete security solution. See [How this fits with other security tools](https://code.claude.com/docs/en/security-guidance#how-this-fits-with-other-security-tools).

## Add your own rules

The plugin has two extension points: a Markdown guidance file for the model-backed reviews, and a YAML or JSON patterns file for the per-edit string match. Both are additive. You can add checks but cannot disable built-in ones from these files.

### Add guidance for the model-backed reviews

These rules are guidance for the reviewer, not deterministic guardrails. The plugin surfaces violations as findings for Claude to fix, but it does not block writes or guarantee every violation is caught. The guidance is additive only: a rule that says to ignore a vulnerability class does not suppress those findings. For hard enforcement, pair the plugin with a [hook that blocks the edit](../hooks-guide.md#block-edits-to-protected-files) or a CI check.

### Add custom per-edit patterns

Create `.claude/security-patterns.yaml` to add regex or substring rules to the [per-edit pattern check](#on-each-file-edit). These run as deterministic string matches alongside the built-in patterns:

```yaml .claude/security-patterns.yaml theme={null}
patterns:
  - rule_name: internal_api_key
    substrings: ["sk_live_", "AKIA"]
    reminder: "Hardcoded API key prefix. Load credentials from the secret manager."
  - rule_name: tenant_unfiltered_query
    regex: "\\.objects\\.all\\(\\)"
    paths: ["**/src/tenants/**"]
    reminder: "Multi-tenant code must filter by org_id."
```

| Field           | Type   | Description                                                                                                                                             |
| :-------------- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rule_name`     | string | Identifier shown in the warning                                                                                                                         |
| `reminder`      | string | Warning text appended to Claude's context, capped at 1 KB                                                                                               |
| `regex`         | string | Python regex matched against the edited content                                                                                                         |
| `substrings`    | list   | Literal substrings; provide this or `regex`                                                                                                             |
| `paths`         | list   | Optional glob patterns; the rule applies only to matching files. Globs match against the full file path, so prefix project-relative patterns with `**/` |
| `exclude_paths` | list   | Optional glob patterns to skip; same matching as `paths`                                                                                                |

The plugin also reads `.claude/security-patterns.yml` and `.claude/security-patterns.json` with the same schema. JSON works on any Python install. The YAML forms require PyYAML to be importable, which the plugin does not install for you. The plugin loads up to 50 custom rules and skips regexes that look prone to catastrophic backtracking.

## How the plugin integrates with Claude Code

The plugin is built entirely on [hooks](../hooks.md), the mechanism for running your own code at specific points in Claude's loop. It registers:

| Hook event                                                       | Purpose                                                                     |
| :--------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| `SessionStart`                                                   | Bootstrap the plugin's Python environment                                   |
| `UserPromptSubmit`                                               | Capture the working-tree baseline that the end-of-turn review diffs against |
| `PostToolUse` on `Edit`, `Write`, and `NotebookEdit`             | Per-edit pattern match                                                      |
| `Stop`                                                           | End-of-turn diff review, run in the background                              |
| `PostToolUse` on `Bash`, filtered to `git commit` and `git push` | Commit and push review, run in the background                               |

If you build your own hooks, the [plugin's source](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/security-guidance) is a working example of running a separate model call from a hook and feeding the result back to the session.

## Related resources

* [Automate workflows with hooks](../hooks-guide.md): build your own checks at the same lifecycle points
