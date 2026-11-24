---
description: Create a reusable Codify template (with variables and conditions) for a setup you describe
argument-hint: <what the template should set up>
allowed-tools: mcp__plugin_codify_codify__search_resources mcp__plugin_codify_codify__get_resource_schema mcp__plugin_codify_codify__search_parameter_completions mcp__plugin_codify_codify__search_templates mcp__plugin_codify_codify__validate_codify_config Bash(codify validate *) Read Write Edit
---
Create a reusable Codify template for: $ARGUMENTS

Follow the codify-config skill, and in particular its "Writing templates" section.

1. If the request is too vague to build a useful template (no clear use case), ask one short question first. Otherwise don't ask: make sensible, opinionated choices.
2. Call `search_templates` for the use case. Include existing templates with a `template` block for anything they cover, and tell the user which ones you included.
3. Find every other resource with `search_resources`, then call `get_resource_schema` for each type you use (batch these calls).
4. Write the template:
   - put everything that differs between users (project names, folders, optional tools, choices like package manager) in `variable` blocks at the top, with a clear `label`, a `default` where one makes sense, and `"sensitive": true` for tokens;
   - gate optional parts with `when`;
   - comment each section with `// ###` headings;
   - no `project` block and no `${{ vars.* }}` / `${{ secrets.* }}` references.
5. Run `validate_codify_config` on the whole template and fix every error until it is valid.
6. Write it to `<short-kebab-name>.codify.jsonc` in the current directory (ask before overwriting an existing file). If the `codify` CLI is installed, also run `codify validate <file>` and fix what it reports.
7. Reply with: the file path, the questions the template asks (variable labels and defaults), the templates it includes, and how to publish it (paste into a setup on the Codify dashboard, then **Publish as template**). Do not run `codify apply`.
