---
name: codify-config
description: Write, edit, review or validate Codify configs (*.codify.jsonc, codify.json, codify.yaml) and Codify templates. Use whenever the user wants to declare a dev machine setup with Codify (packages, runtimes, CLIs, apps, shell aliases, PATH, SSH, git repos), build or edit a reusable Codify template with variables and conditions, or fix a Codify config error.
---

# Codify configs and templates

Codify is "Terraform for your dev machine": a config file declares the tools, packages, apps, shell settings and repositories a machine should have, and `codify apply` makes the machine match, idempotently. A **template** is a reusable config published to the Codify registry (`@profile/name`) that other configs include with one block.

The `codify` MCP server in this plugin gives you the live registry. **Never guess resource types or parameter names. Look them up.**

| Tool | Use it to |
|---|---|
| `search_resources` | Find resource types for a need ("node version manager", "docker"). |
| `get_resource_schema` | Get the exact parameters, defaults, examples, supported OSes and `latest_versions` of a type. Call it for **every** type you use. |
| `search_parameter_completions` | Check that a version the user asked for exists. An empty query returns the newest values. |
| `search_templates` | Find published templates to include instead of re-declaring their resources. |
| `validate_codify_config` | Validate the whole config (pass it as a JSON5 **string**). Always run it before you hand a config back. |

If the tools fail with 401 or are missing, tell the user to run `codify login` and then reconnect the server with `/mcp`.

## Workflow

1. Work out what the user needs. A request that names tools ("add jq") gets those tools and their prerequisites only. A goal ("set up a Python data science machine") gets a complete, opinionated, current toolchain.
2. `search_templates` for the goal. If a template covers part of it, include it with a `template` block.
3. `search_resources` for the rest. Batch the searches in one step.
4. `get_resource_schema` for each type you'll use. Batch these too.
5. Write the config. Use `latest_versions` for versions instead of versions from memory.
6. `validate_codify_config` and fix every error until it is valid.
7. Write the file (`<name>.codify.jsonc`), and if the `codify` CLI is installed, run `codify validate <file>` as well.

Do not run `codify apply` (it changes the user's machine) unless the user asks you to. `codify plan <file>` is read-only and fine to suggest.

## File format

- File names match `*.codify.<ext>` or `codify.<ext>`: `.jsonc` (recommended), `.json`, `.json5`, `.yaml`.
- The file is a **top-level JSON5 array** of blocks. `//` and `/* */` comments and trailing commas are allowed.
- Comments are rendered as markdown in the Codify editor. Use `###` for section titles, not `#`/`##`.

```jsonc
[
  // ### Runtimes
  { "type": "homebrew", "formulae": ["jq"], "casks": ["docker"], "os": ["macOS"] },
  { "type": "nvm", "nodeVersions": ["22"], "global": "22" },
  {
    "type": "git-clone",
    "name": "backend",
    "parentDirectory": "~/projects",
    "remote": "git@github.com:org/backend.git"
  },
  { "type": "path", "path": "$HOME/projects/backend/bin", "dependsOn": ["git-clone.backend"] }
]
```

### Keys every block can have

| Key | Meaning |
|---|---|
| `type` | Required. The resource type (or a core block: `template`, `variable`). |
| `name` | Identifies a block when there are several of the same type. Letters, digits, `-`, `_`. |
| `dependsOn` | IDs that must be applied first: `type`, `type.name`, or `type.0` for unnamed ones (zero-indexed). |
| `os` | `["macOS"]` or `["linux"]`. Only for platform-specific resources (see below). |
| `distro` | Linux distros: `"ubuntu"`, `"debian"`, `"fedora"`, `"arch"`, ... |
| `when` | A condition on variables (see "Conditions"). |

Never write a `"type": "project"` block. The default plugin is always loaded.

### OS gating

Codify runs on macOS and Linux only (never generate Windows configs).
- Most resources support both: **omit `os`**. Never write `"os": ["macOS", "linux"]`.
- `homebrew` gets `"os": ["macOS"]`. `apt`, `snap` and `dnf` get `"os": ["linux"]`. Also gate resources whose schema lists one OS.
- On Linux prefer the native package manager over Homebrew.
- Don't add `git` through Homebrew on macOS: Codify installs the Xcode Command Line Tools, which include git.
- Only ask which OS the user is on when it changes the config (choosing between `homebrew` and `apt`, say).

### `action`: last resort

Use `action` only when no resource type exists. Always give it a `condition` that describes the **end state**: exit code 0 means "already done, skip".

```jsonc
{
  "type": "action",
  "name": "install-mytool",
  "condition": "command -v mytool",   // NOT "! command -v mytool"
  "action": "curl -fsSL https://example.com/install.sh | bash"
}
```

Add `"requiresStdin": true` only for steps that need the user at the keyboard (`gh auth login`, `npm create vite@latest`). In a template this enables an interactive bootstrap step after the automated setup.

## Including templates

```jsonc
[
  { "type": "template", "source": "@codify/nvm" },
  { "type": "pnpm", "dependsOn": ["template"] }
]
```

| Key | Meaning |
|---|---|
| `source` | Required. `@profile/name` from `search_templates`. A bare name means `@codify/<name>`. |
| `version` | Optional version pin. |
| `name` | Needed to reference one of several templates: `dependsOn: ["template.<name>"]`. A single unnamed template is `"template"`. |
| `dependsOn`, `os`, `distro`, `when` | Applied to every resource inside the template. |
| `variables` | Values for the template's variables: `{ "projectName": "my-app" }`. Values may use `${{ }}` references to the including file's variables. |

- **Never copy a template's resources into a config.** Include the block. The template expands in place and stays up to date. Only inline the resources when the user explicitly asks to customize them.
- Don't re-declare resources the template already includes (`search_templates` returns them in `raw_configs`).
- If the same resource ends up in both a template and the file, Codify merges them (file wins), so small overrides next to a template are fine.

## Writing templates

A template is an ordinary config that other people will run. Make it reusable:

1. **Ask for what differs between users with `variable` blocks** instead of hard-coding names, paths or choices.
2. **Use `when` conditions** for optional parts, instead of publishing several near-identical templates.
3. **Compose**: include existing templates (`{ "type": "template", ... }`) for parts the registry already covers.
4. Keep it focused on one use case, and comment each section (the comments are shown to users).
5. Avoid `action` blocks where a resource exists. Users must approve every `action` command in a template before it runs.

Templates can't:
- declare plugins (no `project` block);
- use saved variables or secrets (`${{ vars.* }}`, `${{ secrets.* }}`). Declare a `variable` (with `"sensitive": true` for secrets), and the including config passes the saved reference in through `variables`.

Templates are published from the Codify dashboard: open a setup (or start one at dashboard.codifycli.com/publish), paste the config into its code editor, and choose **Publish as template** in the top bar. Published templates are public. So the end product here is a validated `.codify.jsonc` file the user can paste there.

### Variables

```jsonc
{
  "type": "variable",
  "name": "siteType",                       // identifier: letters, digits, "_", "-"
  "valueType": "enum",                      // text (default) | number | boolean | enum | multiEnum
  "options": ["blog", "docs", "portfolio"], // required for enum / multiEnum
  "default": "blog",
  "label": "What kind of site are you building?", // the question shown to the user
  "description": "Each kind installs its own tools.",
  "sensitive": false,                       // true masks the value (tokens, passwords)
  "when": { "experience": "advanced" }      // only ask in some cases
}
```

- Values are asked on every `codify apply` and never saved. Users can pass them with `--var siteType=docs`.
- Reference a value anywhere in a resource parameter with `${{ siteType }}`. A string that is exactly one reference keeps the type (number, boolean, list); otherwise it is interpolated as text. `$${{ x }}` is a literal.
- Declare every variable you reference. An undeclared `${{ x }}` still works (it is asked as text) but shows a warning.
- References are not allowed in `template.source`.
- Variables are scoped to their file: a template's variables are separate from the variables of the config that includes it.

### Conditions (`when`)

`when` works on resources, templates and variables. Every key must match:

```jsonc
"when": { "siteType": "blog" }                        // equals (multiEnum: includes)
"when": { "siteType": ["blog", "docs"] }              // one of
"when": { "siteType": { "not": "docs" } }             // not
"when": { "any": [{ "siteType": "blog" }, { "addDocker": true }] } // either
"when": { "siteType": "blog", "addDocker": true }     // both
```

A condition may only reference declared variables. A variable whose own `when` didn't match has no value, and conditions on it never match. Blocks removed by a condition are also dropped from other blocks' `dependsOn`.

### Example template

```jsonc
[
  // ### Questions
  {
    "type": "variable",
    "name": "projectName",
    "label": "Project folder name",
    "default": "my-site"
  },
  {
    "type": "variable",
    "name": "packageManager",
    "valueType": "enum",
    "options": ["pnpm", "npm"],
    "default": "pnpm",
    "label": "Which package manager?"
  },
  {
    "type": "variable",
    "name": "addDocker",
    "valueType": "boolean",
    "default": false,
    "label": "Install Docker?"
  },

  // ### Node.js
  { "type": "template", "source": "@codify/nvm" },
  { "type": "pnpm", "when": { "packageManager": "pnpm" }, "dependsOn": ["template"] },

  // ### Optional tools
  { "type": "homebrew", "casks": ["docker"], "os": ["macOS"], "when": { "addDocker": true } },

  // ### Create the project (interactive)
  {
    "type": "action",
    "name": "create-project",
    "condition": "[ -d \"$HOME/projects/${{ projectName }}\" ]",
    "action": "mkdir -p ~/projects && cd ~/projects && npm create astro@latest ${{ projectName }}",
    "requiresStdin": true,
    "dependsOn": ["template"]
  }
]
```

(The parameters above are illustrative. Always confirm them with `get_resource_schema`.)

## Saved variables and secrets (configs only, not templates)

Configs run by a logged-in user can reference values saved in the dashboard (Settings > Variables & Secrets): `${{ vars.user.NAME }}`, `${{ vars.org.NAME }}`, `${{ secrets.user.NAME }}`, `${{ secrets.org.NAME }}`, `${{ secrets.file.NAME }}`. The CLI resolves them at run time. Never put secret values in a config: use a reference or a `sensitive` variable.

## Final checklist

- Every `type` exists, and every parameter came from `get_resource_schema`.
- No `project` block, no redundant `os`, `name` on repeated types.
- `dependsOn` puts package managers and runtimes before what uses them.
- Templates are included with `template` blocks, not copied.
- For templates: values that differ per user are `variable`s, optional parts use `when`, no saved `vars.*`/`secrets.*`.
- `validate_codify_config` returned `valid: true`.
