---
description: Generate a Codify config for this machine or project from a description
argument-hint: <what you want installed or configured>
allowed-tools: mcp__plugin_codify_codify__search_resources mcp__plugin_codify_codify__get_resource_schema mcp__plugin_codify_codify__search_parameter_completions mcp__plugin_codify_codify__search_templates mcp__plugin_codify_codify__validate_codify_config Bash(codify validate *) Read Write Edit
---
Create a Codify config for: $ARGUMENTS

Follow the codify-config skill.

1. If a `*.codify.jsonc` / `codify.json(c)` file already exists in the current directory, read it and add to it instead of starting a new file (keep its existing blocks and comments).
2. Check `search_templates` first and include matching templates with a `template` block.
3. Find the remaining resources with `search_resources` and confirm every parameter with `get_resource_schema`. Match the scope to the request: named tools mean just those tools and their prerequisites, a goal means a complete current toolchain.
4. Run `validate_codify_config` and fix every error until it is valid.
5. Write the file (`codify.jsonc` unless the user named one). If the `codify` CLI is installed, also run `codify validate <file>`.
6. Reply with the file path and a short summary of what it sets up. Suggest `codify plan <file>` to preview, and `codify apply <file>` to apply it. Do not run apply yourself.
