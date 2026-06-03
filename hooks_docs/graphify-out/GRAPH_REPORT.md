# Graph Report - .  (2026-06-03)

## Corpus Check
- 22 files · ~59,904 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 174 nodes · 210 edges · 15 communities (11 shown, 4 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.73)
- Token cost: 298,543 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Config, Debugging & Memory|Config, Debugging & Memory]]
- [[_COMMUNITY_Skills, Subagents & Reasoning Effort|Skills, Subagents & Reasoning Effort]]
- [[_COMMUNITY_Core Hook Events & Lifecycle|Core Hook Events & Lifecycle]]
- [[_COMMUNITY_Permissions & Hook Decision Control|Permissions & Hook Decision Control]]
- [[_COMMUNITY_MCP, Settings & Hook Plumbing|MCP, Settings & Hook Plumbing]]
- [[_COMMUNITY_Agent Teams & Status Line|Agent Teams & Status Line]]
- [[_COMMUNITY_Lifecycle Diagram Session & Turn|Lifecycle Diagram: Session & Turn]]
- [[_COMMUNITY_Lifecycle Diagram Tool & Agentic Loop|Lifecycle Diagram: Tool & Agentic Loop]]
- [[_COMMUNITY_Plugins, Auto-Memory & Workspace Trust|Plugins, Auto-Memory & Workspace Trust]]
- [[_COMMUNITY_Hook Types & goal Stop Hook|Hook Types & /goal Stop Hook]]
- [[_COMMUNITY_Hook Resolution Flow (Bash Matcher)|Hook Resolution Flow (Bash Matcher)]]
- [[_COMMUNITY_Subprocess Env Scrubbing|Subprocess Env Scrubbing]]
- [[_COMMUNITY_Model Selection|Model Selection]]
- [[_COMMUNITY_Common Hook Input Fields|Common Hook Input Fields]]
- [[_COMMUNITY_hooks Menu|/hooks Menu]]

## God Nodes (most connected - your core abstractions)
1. `Hook lifecycle` - 16 edges
2. `Plugin` - 7 edges
3. `Effort Level` - 7 edges
4. `PreToolUse hook event` - 6 edges
5. `Settings (hooks excerpts)` - 6 edges
6. `security-guidance plugin (hook-based review)` - 6 edges
7. `CLAUDE.md` - 6 edges
8. `Skill` - 6 edges
9. `Automate workflows with hooks (guide)` - 5 edges
10. `Path placeholders (CLAUDE_PROJECT_DIR / PLUGIN_ROOT / PLUGIN_DATA)` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Skills vs Hooks (instruction vs enforcement)` --semantically_similar_to--> `PreToolUse Hook (enforcement fallback)`  [INFERRED] [semantically similar]
  hooks_docs/external/skills.md → hooks_docs/external/memory.md
- `Effort Level` --shares_data_with--> `Status Line stdin JSON Data Contract`  [INFERRED]
  hooks_docs/external/model-config.md → hooks_docs/external/statusline.md
- `Workspace Trust Gate` --semantically_similar_to--> `Skills-dir Plugin`  [INFERRED] [semantically similar]
  hooks_docs/external/statusline.md → hooks_docs/external/skills.md
- `Subagent Frontmatter Fields` --semantically_similar_to--> `Skill hooks Frontmatter Field`  [INFERRED] [semantically similar]
  hooks_docs/external/sub-agents.md → hooks_docs/external/skills.md
- `Subagent Scope` --references--> `Plugin`  [EXTRACTED]
  hooks_docs/external/sub-agents.md → hooks_docs/external/plugins.md

## Hyperedges (group relationships)
- **security-guidance plugin multi-hook review flow** — external_security_guidance_plugin, hooks_sessionstart, hooks_userpromptsubmit, hooks_posttooluse, hooks_stop [EXTRACTED 1.00]
- **Auto mode classifier decision order** — external_permission_modes_auto_classifier, external_permissions_manage, external_permission_modes_protected_paths, hooks_permissiondenied [EXTRACTED 1.00]
- **PreToolUse hook + permission rule deny-first precedence** — hooks_pretooluse, hooks_decision_control, external_permissions_extend_with_hooks, external_permissions_manage [EXTRACTED 1.00]
- **Subagent Lifecycle Hook Flow** — external_sub_agents_subagent, external_sub_agents_subagent_start_hook, external_sub_agents_subagent_stop_hook, external_sub_agents_agent_type [EXTRACTED 1.00]
- **Agent Team Quality Gate Hooks** — external_agent_teams_shared_task_list, external_agent_teams_teammate_idle_hook, external_agent_teams_task_created_hook, external_agent_teams_task_completed_hook [EXTRACTED 1.00]
- **Hook Debugging Toolset** — external_debug_your_config_hooks_command, external_debug_your_config_doctor_command, external_debug_your_config_debug_hooks, external_debug_your_config_matcher_field [EXTRACTED 1.00]

## Communities (15 total, 4 thin omitted)

### Community 0 - "Config, Debugging & Memory"
Cohesion: 0.10
Nodes (22): Clean Configuration Test, claude --debug hooks, /doctor Command, /hooks Command, Hook matcher Field, Settings Scope Precedence, DEBUG env var, Env Var Precedence (+14 more)

### Community 1 - "Skills, Subagents & Reasoning Effort"
Cohesion: 0.12
Nodes (19): CLAUDE_EFFORT, CLAUDE_ENV_FILE, CLAUDE_CODE_STOP_HOOK_BLOCK_CAP, Path-specific Rules, Project Rules (.claude/rules/), Adaptive Reasoning, Effort Level, Extended Thinking (+11 more)

### Community 2 - "Core Hook Events & Lifecycle"
Cohesion: 0.14
Nodes (19): Auto mode classifier, Security guidance plugin (hooks excerpts), Per-edit security patterns (security-patterns.yaml), security-guidance plugin (hook-based review), Worktrees (hooks excerpts), .worktreeinclude, CLAUDE_ENV_FILE, CwdChanged hook event (+11 more)

### Community 3 - "Permissions & Hook Decision Control"
Cohesion: 0.16
Nodes (18): MCP tool naming (mcp__server__tool), Permission modes (hooks excerpts), Permission modes, Protected paths, Permissions (hooks excerpts), Extend permissions with hooks, Manage permissions (deny-first precedence), Permission rule syntax (+10 more)

### Community 4 - "MCP, Settings & Hook Plumbing"
Cohesion: 0.13
Nodes (18): MCP (hooks excerpts), MCP elicitation, Local stdio MCP server (CLAUDE_PROJECT_DIR), Plugins reference (hooks excerpts), Plugin hooks component, Persistent data directory (CLAUDE_PLUGIN_DATA), Plugin userConfig, Settings (hooks excerpts) (+10 more)

### Community 5 - "Agent Teams & Status Line"
Cohesion: 0.12
Nodes (17): Agent Team, Shared Task List, Subagent Definition as Teammate, TaskCompleted Hook, TaskCreated Hook, TeammateIdle Hook, CLAUDE_CODE_SESSION_ID, CLAUDECODE (+9 more)

### Community 6 - "Lifecycle Diagram: Session & Turn"
Cohesion: 0.12
Nodes (17): ConfigChange (Async), CwdChanged / FileChanged (Env reactive), Each Turn (boundary), InstructionsLoaded (Async), MessageDisplay (Display), Notification (Async), PostCompact, PreCompact (+9 more)

### Community 7 - "Lifecycle Diagram: Tool & Agentic Loop"
Cohesion: 0.18
Nodes (12): Agentic Loop (boundary), Elicitation (MCP input), ElicitationResult (MCP input), Permission Denied (auto-mode deny), PermissionRequest, PostToolBatch, PostToolUse / PostToolUseFailure, PreToolUse (+4 more)

### Community 8 - "Plugins, Auto-Memory & Workspace Trust"
Cohesion: 0.20
Nodes (10): system/init Event, Auto Memory, autoMemoryDirectory, Plugin, plugin.json Manifest, /reload-plugins, Standalone vs Plugin Configuration, Skill Live Change Detection (+2 more)

### Community 9 - "Hook Types & /goal Stop Hook"
Cohesion: 0.29
Nodes (8): /goal command, /goal (hooks excerpts), Hook configuration (allowManagedHooksOnly / allowedHttpHookUrls), Agent-based hook type, disableAllHooks, HTTP hook type, Prompt-based hook type, Stop hook event

### Community 10 - "Hook Resolution Flow (Bash Matcher)"
Cohesion: 0.36
Nodes (8): Blocked (permissionDecision: deny), Claude Code continues, Claude runs Bash "rm -rf /tmp/build", Your hook command: block-rm.sh, Hook not matched: tool proceeds, Your if: "Bash(rm *)" match?, Your matcher: "Bash" match?, PreToolUse fires (tool_name: Bash, command: rm -rf /tmp/build)

## Knowledge Gaps
- **57 isolated node(s):** `PermissionRequest hook event`, `SubagentStop hook event`, `FileChanged hook event`, `Notification hook event`, `Hook exit code output` (+52 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Hook lifecycle` connect `Core Hook Events & Lifecycle` to `Hook Types & /goal Stop Hook`, `Permissions & Hook Decision Control`, `MCP, Settings & Hook Plumbing`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `Plugin` connect `Plugins, Auto-Memory & Workspace Trust` to `Config, Debugging & Memory`, `Agent Teams & Status Line`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `Subagent Frontmatter Fields` connect `Skills, Subagents & Reasoning Effort` to `Agent Teams & Status Line`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `PermissionRequest hook event`, `SubagentStop hook event`, `FileChanged hook event` to the rest of the system?**
  _59 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Config, Debugging & Memory` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Skills, Subagents & Reasoning Effort` be split into smaller, more focused modules?**
  _Cohesion score 0.12280701754385964 - nodes in this community are weakly interconnected._
- **Should `Core Hook Events & Lifecycle` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._