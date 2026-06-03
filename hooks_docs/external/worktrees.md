---
source_url: https://code.claude.com/docs/en/worktrees.md
topic: worktrees
relevance: hooks
---

# worktrees — hooks-relevant excerpts

> 📄 Full page: https://code.claude.com/docs/en/worktrees.md

> Kept: WorktreeCreate hook (replaces default git worktree logic / custom location), copy-gitignored-files-into-worktrees (.worktreeinclude that hooks replace), EnterWorktree tool, non-git WorktreeCreate/WorktreeRemove hooks with full JSON example.

## Start Claude in a worktree (hook to relocate worktrees)

Pass `--worktree` or `-w` to create an isolated worktree and start Claude in it. By default, the worktree is created under `.claude/worktrees/<value>/` at your repository root, on a new branch named `worktree-<value>`:

```bash theme={null}
claude --worktree feature-auth
```

To put worktrees somewhere else, configure a [`WorktreeCreate` hook](https://code.claude.com/docs/en/worktrees#non-git-version-control).

You can also ask Claude to "work in a worktree" during a session, and it will create one with the [`EnterWorktree`](https://code.claude.com/docs/en/tools-reference) tool. Once in a worktree, Claude can switch directly to another one under `.claude/worktrees/` by calling `EnterWorktree` with the target path. The previous worktree stays on disk untouched.

### Choose the base branch (full control via hook)

For full control over how worktrees are created, configure a [`WorktreeCreate` hook](../hooks.md#worktreecreate), which replaces the default `git worktree` logic entirely.

## Copy gitignored files into worktrees

A worktree is a fresh checkout, so untracked files like `.env` or `.env.local` from your main repository are not present. To copy them automatically when Claude creates a worktree, add a `.worktreeinclude` file to your project root.

The file uses `.gitignore` syntax. Only files that match a pattern and are also gitignored are copied, so tracked files are never duplicated.

This `.worktreeinclude` copies two env files and a secrets config into each new worktree:

```text .worktreeinclude theme={null}
.env
.env.local
config/secrets.json
```

This applies to worktrees created with `--worktree`, [subagent worktrees](https://code.claude.com/docs/en/worktrees#isolate-subagents-with-worktrees), and parallel sessions in the [desktop app](https://code.claude.com/docs/en/desktop#work-in-parallel-with-sessions).

## Non-git version control (WorktreeCreate and WorktreeRemove hooks)

Worktree isolation uses git by default. For SVN, Perforce, Mercurial, or other systems, configure [`WorktreeCreate` and `WorktreeRemove` hooks](../hooks.md#worktreecreate) to provide custom creation and cleanup logic. Because the hook replaces the default git behavior, [`.worktreeinclude`](#copy-gitignored-files-into-worktrees) is not processed when you use `--worktree`. Copy any local configuration files inside your hook script instead.

This `WorktreeCreate` hook reads the worktree name from stdin, checks out a fresh SVN working copy, and prints the directory path so Claude Code can use it as the session's working directory:

```json theme={null}
{
  "hooks": {
    "WorktreeCreate": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'NAME=$(jq -r .name); DIR=\"$HOME/.claude/worktrees/$NAME\"; svn checkout https://svn.example.com/repo/trunk \"$DIR\" >&2 && echo \"$DIR\"'"
          }
        ]
      }
    ]
  }
}
```

Pair it with a `WorktreeRemove` hook to clean up when the session ends. See the [hooks reference](../hooks.md#worktreecreate) for the input schema and a removal example.
