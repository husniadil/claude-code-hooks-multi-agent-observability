---
source_url: https://code.claude.com/docs/en/settings.md
topic: settings
relevance: hooks
---

# settings — hooks-relevant excerpts

> 📄 Full page: https://code.claude.com/docs/en/settings.md

> Kept: linked_anchors in full (Settings files, Hook configuration, Available settings — header + hook/scope/precedence rows); plus Configuration scopes (scope system + precedence + what-uses-scopes), When edits take effect (ConfigChange hook + hooks reload), Permission settings & rule syntax (hook/permission interplay), File suggestion settings (shares hook env incl. CLAUDE_PROJECT_DIR), policy helper, Settings precedence, Verify active settings, Key points, Excluding sensitive files, strictPluginOnlyCustomization (hooks lockdown), Environment variables, Tools available (hook matchers), See also (debug hooks). Dropped: themes/UI/voice/spinner/worktree/sandbox-internals/attribution/subagent/marketplace sections unrelated to hooks.

## Configuration scopes

Claude Code uses a **scope system** to determine where configurations apply and who they're shared with. Understanding scopes helps you decide how to configure Claude Code for personal use, team collaboration, or enterprise deployment.

### Available scopes

| Scope       | Location                                                                           | Who it affects                       | Shared with team?      |
| :---------- | :--------------------------------------------------------------------------------- | :----------------------------------- | :--------------------- |
| **Managed** | Server-managed settings, plist / registry, or system-level `managed-settings.json` | All users on the machine             | Yes (deployed by IT)   |
| **User**    | `~/.claude/` directory                                                             | You, across all projects             | No                     |
| **Project** | `.claude/` in repository                                                           | All collaborators on this repository | Yes (committed to git) |
| **Local**   | `.claude/settings.local.json`                                                      | You, in this repository only         | No (gitignored)        |

### When to use each scope

**Managed scope** is for:

* Security policies that must be enforced organization-wide
* Compliance requirements that can't be overridden
* Standardized configurations deployed by IT/DevOps

**User scope** is best for:

* Personal preferences you want everywhere (themes, editor settings)
* Tools and plugins you use across all projects
* API keys and authentication (stored securely)

**Project scope** is best for:

* Team-shared settings (permissions, hooks, MCP servers)
* Plugins the whole team should have
* Standardizing tooling across collaborators

**Local scope** is best for:

* Personal overrides for a specific project
* Testing configurations before sharing with the team
* Machine-specific settings that won't work for others

### How scopes interact

When the same setting appears in multiple scopes, Claude Code applies them in priority order:

1. **Managed** (highest) - can't be overridden by anything
2. **Command line arguments** - temporary session overrides
3. **Local** - overrides project and user settings
4. **Project** - overrides user settings
5. **User** (lowest) - applies when nothing else specifies the setting

For example, if your user settings set `spinnerTipsEnabled` to `true` and project settings set it to `false`, the project value applies. Permission rules behave differently because they merge across scopes rather than override. See [Settings precedence](#settings-precedence).

### What uses scopes

Scopes apply to many Claude Code features:

| Feature         | User location             | Project location                   | Local location                 |
| :-------------- | :------------------------ | :--------------------------------- | :----------------------------- |
| **Settings**    | `~/.claude/settings.json` | `.claude/settings.json`            | `.claude/settings.local.json`  |
| **Subagents**   | `~/.claude/agents/`       | `.claude/agents/`                  | None                           |
| **MCP servers** | `~/.claude.json`          | `.mcp.json`                        | `~/.claude.json` (per-project) |
| **Plugins**     | `~/.claude/settings.json` | `.claude/settings.json`            | `.claude/settings.local.json`  |
| **CLAUDE.md**   | `~/.claude/CLAUDE.md`     | `CLAUDE.md` or `.claude/CLAUDE.md` | `CLAUDE.local.md`              |

On Windows, paths shown as `~/.claude` resolve to `%USERPROFILE%\.claude`.

***

## Settings files

The `settings.json` file is the official mechanism for configuring Claude
Code through hierarchical settings:

* **User settings** are defined in `~/.claude/settings.json` and apply to all
  projects.
* **Project settings** are saved in your project directory:
  * `.claude/settings.json` for settings that are checked into source control and shared with your team
  * `.claude/settings.local.json` for settings that are not checked in, useful for personal preferences and experimentation. Claude Code will configure git to ignore `.claude/settings.local.json` when it is created.
* **Managed settings**: For organizations that need centralized control, Claude Code supports multiple delivery mechanisms for managed settings. All use the same JSON format and cannot be overridden by user or project settings:

  * **Server-managed settings**: delivered from Anthropic's servers via the Claude.ai admin console. See [server-managed settings](https://code.claude.com/docs/en/server-managed-settings).
  * **MDM/OS-level policies**: delivered through native device management on macOS and Windows:
    * macOS: `com.anthropic.claudecode` managed preferences domain. The plist's top-level keys mirror `managed-settings.json`, with nested settings as dictionaries and arrays as plist arrays. Deploy via configuration profiles in Jamf, Iru (Kandji), or similar MDM tools.
    * Windows: `HKLM\SOFTWARE\Policies\ClaudeCode` registry key with a `Settings` value (REG\_SZ or REG\_EXPAND\_SZ) containing JSON (deployed via Group Policy or Intune)
    * Windows (user-level): `HKCU\SOFTWARE\Policies\ClaudeCode` (lowest policy priority, only used when no admin-level source exists)
  * **File-based**: `managed-settings.json` and `managed-mcp.json` deployed to system directories:

    * macOS: `/Library/Application Support/ClaudeCode/`
    * Linux and WSL: `/etc/claude-code/`
    * Windows: `C:\Program Files\ClaudeCode\`

    <Warning>
      The legacy Windows path `C:\ProgramData\ClaudeCode\managed-settings.json` is no longer supported as of v2.1.75. Administrators who deployed settings to that location must migrate files to `C:\Program Files\ClaudeCode\managed-settings.json`.
    </Warning>

    File-based managed settings also support a drop-in directory at `managed-settings.d/` in the same system directory alongside `managed-settings.json`. This lets separate teams deploy independent policy fragments without coordinating edits to a single file.

    Following the systemd convention, `managed-settings.json` is merged first as the base, then all `*.json` files in the drop-in directory are sorted alphabetically and merged on top. Later files override earlier ones for scalar values; arrays are concatenated and de-duplicated; objects are deep-merged. Hidden files starting with `.` are ignored.

    Use numeric prefixes to control merge order, for example `10-telemetry.json` and `20-security.json`.

  See [managed settings](permissions.md#managed-only-settings) and [Managed MCP configuration](https://code.claude.com/docs/en/managed-mcp) for details.

  This [repository](https://github.com/anthropics/claude-code/tree/main/examples/mdm) includes starter deployment templates for Jamf, Iru (Kandji), Intune, and Group Policy. Use these as starting points and adjust them to fit your needs.

  <Note>
    Managed deployments can also restrict **plugin marketplace additions** using
    `strictKnownMarketplaces`. For more information, see [Managed marketplace restrictions](https://code.claude.com/docs/en/plugin-marketplaces#managed-marketplace-restrictions).
  </Note>
* **Other configuration** is stored in `~/.claude.json`. This file contains your OAuth session, [MCP server](mcp.md) configurations for user and local scopes, per-project state (allowed tools, trust settings), and various caches. Project-scoped MCP servers are stored separately in `.mcp.json`.

<Note>
  Claude Code automatically creates timestamped backups of configuration files and retains the five most recent backups to prevent data loss.
</Note>

```JSON Example settings.json theme={null}
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm run lint)",
      "Bash(npm run test *)",
      "Read(~/.zshrc)"
    ],
    "deny": [
      "Bash(curl *)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ]
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp"
  },
  "companyAnnouncements": [
    "Welcome to Acme Corp! Review our code guidelines at docs.acme.com",
    "Reminder: Code reviews required for all PRs",
    "New security policy in effect"
  ]
}
```

The `$schema` line in the example above points to the [official JSON schema](https://json.schemastore.org/claude-code-settings.json) for Claude Code settings. Adding it to your `settings.json` enables autocomplete and inline validation in VS Code, Cursor, and any other editor that supports JSON schema validation.

The published schema is updated periodically and may not include settings added in the most recent CLI releases, so a validation warning on a recently documented field does not necessarily mean your configuration is invalid.

### When edits take effect

Claude Code watches your settings files and reloads them when they change, so edits to most keys apply to the running session without a restart. This includes `permissions`, `hooks`, and credential helpers like `apiKeyHelper`. The reload covers user, project, local, and managed settings, and the [`ConfigChange` hook](../hooks.md#configchange) fires for each detected change.

A few keys are read once at session start and apply on the next restart instead:

* `model`: use [`/model`](model-config.md#setting-your-model) to switch mid-session
* [`outputStyle`](https://code.claude.com/docs/en/output-styles): part of the system prompt, which is rebuilt on `/clear` or restart

### Available settings

`settings.json` supports a number of options:

> Hooks-relevant rows kept from the full Available settings table (UI/theming/telemetry/voice/model-selection rows dropped):

| Key                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Example                                                                                                                        |
| :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `allowedHttpHookUrls`             | Allowlist of URL patterns that HTTP hooks may target. Supports `*` as a wildcard. When set, hooks with non-matching URLs are blocked. Undefined = no restriction, empty array = block all HTTP hooks. Arrays merge across settings sources. See [Hook configuration](#hook-configuration)                                                                                                                                                                                                                                                                                                       | `["https://hooks.example.com/*"]`                                                                                              |
| `allowManagedHooksOnly`           | (Managed settings only) Only managed hooks, SDK hooks, and hooks from plugins force-enabled in managed settings `enabledPlugins` are loaded. User, project, and all other plugin hooks are blocked. See [Hook configuration](#hook-configuration)                                                                                                                                                                                                                                                                                                                                               | `true`                                                                                                                         |
| `allowManagedPermissionRulesOnly` | (Managed settings only) Prevent user and project settings from defining `allow`, `ask`, or `deny` permission rules. Only rules in managed settings apply. See [Managed-only settings](permissions.md#managed-only-settings)                                                                                                                                                                                                                                                                                                                                                                    | `true`                                                                                                                         |
| `apiKeyHelper`                    | Custom script, to be executed in `/bin/sh`, to generate an auth value. This value will be sent as `X-Api-Key` and `Authorization: Bearer` headers for model requests. Set the refresh interval with [`CLAUDE_CODE_API_KEY_HELPER_TTL_MS`](env-vars.md)                                                                                                                                                                                                                                                                                                                                         | `/bin/generate_temp_api_key.sh`                                                                                                |
| `disableAllHooks`                 | Disable all [hooks](../hooks.md) and any custom [status line](statusline.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `true`                                                                                                                         |
| `env`                             | Environment variables applied to every session and to subprocesses Claude Code spawns from it. {/* min-version: 2.1.143 */}As of v2.1.143, `NO_COLOR` and `FORCE_COLOR` set here are passed to subprocesses but do not change Claude Code's own interface colors. Set those in your shell before launching `claude` to change interface colors                                                                                                                                                                                                                                                  | `{"FOO": "bar"}`                                                                                                               |
| `hooks`                           | Configure custom commands to run at lifecycle events. See [hooks documentation](../hooks.md) for format                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | See [hooks](../hooks.md)                                                                                                         |
| `httpHookAllowedEnvVars`          | Allowlist of environment variable names HTTP hooks may interpolate into headers. When set, each hook's effective `allowedEnvVars` is the intersection with this list. Undefined = no restriction. Arrays merge across settings sources. See [Hook configuration](#hook-configuration)                                                                                                                                                                                                                                                                                                           | `["MY_TOKEN", "HOOK_SECRET"]`                                                                                                  |
| `permissions`                     | See table below for structure of permissions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |                                                                                                                                |
| `policyHelper`                    | {/* min-version: 2.1.136 */}Admin-deployed executable that computes managed settings dynamically at startup. Only honored from MDM or a system `managed-settings.json` file. See [Compute managed settings with a policy helper](#compute-managed-settings-with-a-policy-helper). Requires Claude Code v2.1.136 or later                                                                                                                                                                                                                                                                        | `{"path": "/usr/local/bin/claude-policy"}`                                                                                     |
| `statusLine`                      | Configure a custom status line to display context. See [`statusLine` documentation](statusline.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `{"type": "command", "command": "~/.claude/statusline.sh"}`                                                                    |
| `strictPluginOnlyCustomization`   | (Managed settings only) Block skills, agents, hooks, and MCP servers from user and project sources, so they can only come from plugins or managed settings. `true` locks all four surfaces; an array locks only the named ones. See [`strictPluginOnlyCustomization`](#strictpluginonlycustomization)                                                                                                                                                                                                                                                                                           | `["skills", "hooks"]`                                                                                                          |

***

## Permission settings

> Kept because hooks interact with permission rules (e.g. a `PreToolUse` hook can decide/allow/deny tool use, and permission denies merge across scopes).

| Keys                                | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Example                                                                |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------- |
| `allow`                             | Array of permission rules to allow tool use. See [Permission rule syntax](#permission-rule-syntax) below for pattern matching details                                                                                                                                                                                                                                                                                                                                                                               | `[ "Bash(git diff *)" ]`                                               |
| `ask`                               | Array of permission rules to ask for confirmation upon tool use. See [Permission rule syntax](#permission-rule-syntax) below                                                                                                                                                                                                                                                                                                                                                                                        | `[ "Bash(git push *)" ]`                                               |
| `deny`                              | Array of permission rules to deny tool use. Use this to exclude sensitive files from Claude Code access. See [Permission rule syntax](#permission-rule-syntax) and [Bash permission limitations](permissions.md#tool-specific-permission-rules)                                                                                                                                                                                                                                                                    | `[ "WebFetch", "Bash(curl *)", "Read(./.env)", "Read(./secrets/**)" ]` |
| `additionalDirectories`             | Additional [working directories](https://code.claude.com/docs/en/permissions#working-directories) for file access. Most `.claude/` configuration is [not discovered](https://code.claude.com/docs/en/permissions#additional-directories-grant-file-access-not-configuration) from these directories                                                                                                                                                                                                                                                                         | `[ "../docs/" ]`                                                       |
| `defaultMode`                       | Default [permission mode](permission-modes.md) when opening Claude Code. Valid values: `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`. {/* min-version: 2.1.142 */}As of Claude Code v2.1.142, `auto` is ignored when set in project or local settings (`.claude/settings.json`, `.claude/settings.local.json`) so a repository cannot grant itself auto mode. Set it in `~/.claude/settings.json` instead. The `--permission-mode` CLI flag overrides this setting for a single session | `"acceptEdits"`                                                        |

### Permission rule syntax

Permission rules follow the format `Tool` or `Tool(specifier)`. Rules are evaluated in order: deny rules first, then ask, then allow. The first matching rule wins.

Quick examples:

| Rule                           | Effect                                   |
| :----------------------------- | :--------------------------------------- |
| `Bash`                         | Matches all Bash commands                |
| `Bash(npm run *)`              | Matches commands starting with `npm run` |
| `Read(./.env)`                 | Matches reading the `.env` file          |
| `WebFetch(domain:example.com)` | Matches fetch requests to example.com    |

For the complete rule syntax reference, including wildcard behavior, tool-specific patterns for Read, Edit, WebFetch, MCP, and Agent rules, and security limitations of Bash patterns, see [Permission rule syntax](permissions.md#permission-rule-syntax).

***

## File suggestion settings

> Kept because the file-suggestion command runs with the same environment as hooks, including `CLAUDE_PROJECT_DIR`.

Configure a custom command for `@` file path autocomplete. The built-in file suggestion uses fast filesystem traversal, but large monorepos may benefit from project-specific indexing such as a pre-built file index or custom tooling.

```json theme={null}
{
  "fileSuggestion": {
    "type": "command",
    "command": "~/.claude/file-suggestion.sh"
  }
}
```

The command runs with the same environment variables as [hooks](../hooks.md), including `CLAUDE_PROJECT_DIR`. It receives JSON via stdin with a `query` field:

```json theme={null}
{"query": "src/comp"}
```

Output newline-separated file paths to stdout (currently limited to 15):

```text theme={null}
src/components/Button.tsx
src/components/Modal.tsx
src/components/Form.tsx
```

**Example:**

```bash theme={null}
#!/bin/bash
query=$(cat | jq -r '.query')
your-repo-file-index --query "$query" | head -20
```

## Hook configuration

These settings control which hooks are allowed to run and what HTTP hooks can access. The `allowManagedHooksOnly` setting can only be configured in [managed settings](#settings-files). The URL and env var allowlists can be set at any settings level and merge across sources.

**Behavior when `allowManagedHooksOnly` is `true`:**

* Managed hooks and SDK hooks are loaded
* Hooks from plugins force-enabled in managed settings `enabledPlugins` are loaded. This lets administrators distribute vetted hooks through an organization marketplace while blocking everything else. Trust is granted by full `plugin@marketplace` ID, so a plugin with the same name from a different marketplace stays blocked
* User hooks, project hooks, and all other plugin hooks are blocked

**Restrict HTTP hook URLs:**

Limit which URLs HTTP hooks can target. Supports `*` as a wildcard for matching. When the array is defined, HTTP hooks targeting non-matching URLs are silently blocked. Hostname matching is case-insensitive and ignores a trailing FQDN dot, matching DNS semantics.

```json theme={null}
{
  "allowedHttpHookUrls": ["https://hooks.example.com/*", "http://localhost:*"]
}
```

**Restrict HTTP hook environment variables:**

Limit which environment variable names HTTP hooks can interpolate into header values. Each hook's effective `allowedEnvVars` is the intersection of its own list and this setting.

```json theme={null}
{
  "httpHookAllowedEnvVars": ["MY_TOKEN", "HOOK_SECRET"]
}
```

## Compute managed settings with a policy helper

The `policyHelper` setting points at an executable that computes managed settings at startup, so admins can derive policy from device posture, identity, or a remote service instead of a static file. Configure it from MDM or a system `managed-settings.json` file. Claude Code ignores `policyHelper` when it appears in any other scope, including user settings, project settings, the HKCU registry hive, and [server-managed settings](https://code.claude.com/docs/en/server-managed-settings).

The setting accepts these keys:

| Key                 | Type   | Description                                                                                             |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `path`              | string | Absolute path to the helper executable                                                                  |
| `timeoutMs`         | number | How long to wait for the helper before treating the run as failed                                       |
| `refreshIntervalMs` | number | How often to re-run the helper in the background. Set to `0` to disable refresh, or to at least `60000` |

The helper writes a JSON envelope to stdout. Put the settings under a `managedSettings` key rather than at the top level, since a bare settings object parses with `managedSettings` undefined and applies nothing:

```json theme={null}
{
  "managedSettings": {
    "permissions": { "deny": ["Read(//etc/secrets/**)"] }
  },
  "claudeMd": "# Organization context\n...",
  "appendSystemPrompt": "Always cite the internal style guide."
}
```

When the helper emits `managedSettings`, that object replaces the file-based managed settings for the run. When the helper exits non-zero at startup, Claude Code prints the error and refuses to start, so a helper that needs outage resilience should serve from its own cache and exit `0`.

## Settings precedence

Settings apply in order of precedence. From highest to lowest:

1. **Managed settings** ([server-managed](https://code.claude.com/docs/en/server-managed-settings), [MDM/OS-level policies](#configuration-scopes), or [managed settings](settings.md#settings-files))
   * Policies deployed by IT through server delivery, MDM configuration profiles, registry policies, or managed settings files
   * Cannot be overridden by any other level, including command line arguments
   * Within the managed tier, precedence is: server-managed > MDM/OS-level policies > file-based (`managed-settings.d/*.json` + `managed-settings.json`) > HKCU registry (Windows only). Only one managed source is used; sources do not merge across tiers. Within the file-based tier, drop-in files and the base file are merged together.
   * Embedding hosts such as Claude Desktop can supply policy via the SDK `managedSettings` option. By default this is ignored when any managed-settings tier is present. Administrators can opt in by setting [`parentSettingsBehavior`](#available-settings) to `"merge"`. The embedder's values are filtered so they can tighten managed policy but not loosen it.

2. **Command line arguments**
   * Temporary overrides for a specific session. JSON passed via `--settings <file-or-json>` merges with file-based settings using the same rules as the other layers: a key set here overrides the same key in local, project, or user settings, and omitting a key leaves the lower-layer value in place

3. **Local project settings** (`.claude/settings.local.json`)
   * Personal project-specific settings

4. **Shared project settings** (`.claude/settings.json`)
   * Team-shared project settings in source control

5. **User settings** (`~/.claude/settings.json`)
   * Personal global settings

This hierarchy ensures that organizational policies are always enforced while still allowing teams and individuals to customize their experience. The same precedence applies whether you run Claude Code from the CLI, the [VS Code extension](https://code.claude.com/docs/en/vs-code), or a [JetBrains IDE](https://code.claude.com/docs/en/jetbrains).

For example, if your user settings set `permissions.defaultMode` to `acceptEdits` and a project's shared settings set it to `default`, the project value applies. The example below covers how array-valued settings such as permission rules combine instead.

<Note>
  **Array settings merge across scopes.** When the same array-valued setting (such as `sandbox.filesystem.allowWrite` or `permissions.allow`) appears in multiple scopes, the arrays are **concatenated and deduplicated**, not replaced. This means lower-priority scopes can add entries without overriding those set by higher-priority scopes, and vice versa. For example, if managed settings set `allowWrite` to `["/opt/company-tools"]` and a user adds `["~/.kube"]`, both paths are included in the final configuration.
</Note>

## Verify active settings

Run `/status` inside Claude Code to see which settings sources are active. The Status tab includes a `Setting sources` line that lists each layer Claude Code loaded for the current session, such as `User settings` or `Project local settings`. When [managed settings](https://code.claude.com/docs/en/managed-settings) are in effect, the entry shows the delivery channel in parentheses, for example `Enterprise managed settings (remote)`, `(plist)`, `(HKLM)`, `(HKCU)`, or `(file)`. A layer appears in the list only when that source is loaded with at least one key, so an empty list means no settings sources were found.

The `Setting sources` line confirms which sources are being read. It does not show which layer supplied each individual key. The Config tab in the same dialog is an editor for a fixed set of toggles such as theme and verbose output, not a view of your `settings.json` contents. If a settings file contains errors, such as invalid JSON or a value that fails validation, `/status` reports the issue so you can fix it.

## Key points about the configuration system

* **Memory files (`CLAUDE.md`)**: Contain instructions and context that Claude loads at startup
* **Settings files (JSON)**: Configure permissions, environment variables, and tool behavior
* **Skills**: Custom prompts that can be invoked with `/skill-name` or loaded by Claude automatically
* **MCP servers**: Extend Claude Code with additional tools and integrations
* **Precedence**: Higher-level configurations (Managed) override lower-level ones (User/Project)
* **Inheritance**: Settings merge across scopes; scalar values from higher-priority scopes override, and arrays concatenate

## Excluding sensitive files

To prevent Claude Code from accessing files containing sensitive information like API keys, secrets, and environment files, use the `permissions.deny` setting in your `.claude/settings.json` file:

```json theme={null}
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./config/credentials.json)",
      "Read(./build)"
    ]
  }
}
```

This replaces the deprecated `ignorePatterns` configuration. Files matching these patterns are excluded from file discovery and search results, and read operations on these files are denied.

## `strictPluginOnlyCustomization`

**Managed settings only**: blocks skills, agents, hooks, and MCP servers from user and project sources, so they can only come from plugins or managed settings. Combine it with `strictKnownMarketplaces` to control the full customization supply chain: the marketplace allowlist controls which plugins users can install, and this setting blocks everything that doesn't come from a plugin or from managed settings.

<Note>
  `strictPluginOnlyCustomization` requires Claude Code v2.1.82 or later. Earlier versions ignore the key and keep loading user and project customizations, so the lockdown isn't enforced until clients update.
</Note>

The value is either `true` to lock all four surfaces, or an array naming the surfaces to lock:

```json theme={null}
{
  "strictPluginOnlyCustomization": ["skills", "hooks"]
}
```

For each locked surface, Claude Code skips user-level and project-level sources and loads only plugin-provided and managed sources:

| Surface  | Blocked when locked                               | Still loads                                                            |
| :------- | :------------------------------------------------ | :-------------------------------------------------------------------- |
| `skills` | `~/.claude/skills/`, `.claude/skills/`            | Plugin skills, bundled skills, skills in the managed policy directory  |
| `agents` | `~/.claude/agents/`, `.claude/agents/`            | Plugin agents, built-in agents, agents in the managed policy directory |
| `hooks`  | Hooks in user, project, and local `settings.json` | Plugin hooks, hooks in managed settings                                |
| `mcp`    | Servers in `~/.claude.json` and `.mcp.json`       | Plugin MCP servers, [`managed-mcp.json`](https://code.claude.com/docs/en/managed-mcp) servers      |

Surface names that a Claude Code version doesn't recognize are ignored rather than failing the settings file, so you can add new surface names before all clients have updated.

## Environment variables

Environment variables let you control Claude Code behavior without editing settings files. Any variable can also be configured in [`settings.json`](#available-settings) under the `env` key to apply it to every session or roll it out to your team.

See the [environment variables reference](env-vars.md) for the full list.

## Tools available to Claude

Claude Code has access to a set of tools for reading, editing, searching, running commands, and orchestrating subagents. Tool names are the exact strings you use in permission rules and hook matchers.

See the [tools reference](https://code.claude.com/docs/en/tools-reference) for the full list and Bash tool behavior details.

## See also

* [Permissions](permissions.md): permission system, rule syntax, tool-specific patterns, and managed policies
* [Debug your configuration](debug-your-config.md): diagnose why a setting, hook, or MCP server isn't taking effect
