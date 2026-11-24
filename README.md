# Codify plugin for Claude Code

Write [Codify](https://codifycli.com) configs and templates with Claude, using the live Codify resource registry.

The plugin adds:

- **The `codify` MCP server**, connected to the registry (`https://agent.codifycli.com/api/mcp/codify/mcp`), with these tools:
  - `search_resources`: find resource types
  - `get_resource_schema`: exact parameters, examples and the latest versions
  - `search_parameter_completions`: check versions
  - `search_templates`: find published templates
  - `validate_codify_config`: validate a config against the registry
- **The `codify-config` skill**: the Codify config format, templates, variables and conditions, and the rules Claude follows when it writes configs. It loads automatically when you work on a Codify config.
- **Slash commands**:
  - `/codify:template <description>`: create a reusable template with variables and conditions, validated and written to `<name>.codify.jsonc`.
  - `/codify:config <description>`: create or extend a `codify.jsonc` for your machine or project.

## Install

Requirements:
- Claude Code
- Optional: the [Codify CLI](https://codifycli.com/docs), to check and apply the configs Claude writes (`codify validate`, `codify plan`, `codify apply`)

Inside Claude Code:

```
/plugin marketplace add codifycli/claude-plugin
/plugin install codify@codify
```

Or from a shell:

```bash
claude plugin marketplace add codifycli/claude-plugin
```
```bash
claude plugin install codify@codify
```

Run `/mcp` to check that `plugin:codify:codify` is connected.

## No login needed

The registry tools are public, so the plugin works without a Codify account. You only need to log in to the Codify CLI to use saved variables and secrets, or your private dashboard documents, when you apply a config.

## Examples

```
/codify:template an Astro blog starter: Node LTS, pnpm or npm, optional Docker, then scaffold the project interactively
/codify:config add jq, ripgrep and the GitHub CLI
```

Then preview or apply the result:

```bash
codify plan my-template.codify.jsonc
```

To publish a template, paste it into a setup on the [Codify dashboard](https://dashboard.codifycli.com/publish) and choose **Publish as template**.

## Development

Load the plugin from a checkout without installing it:

```bash
claude --plugin-dir ./
```

To try it against a local `wrangler dev` of the Codify agent server, change the `url` in `.mcp.json` to `http://localhost:8787/api/mcp/codify/mcp`. Don't commit that change.

Check the plugin files:

```bash
claude plugin validate ./
```

The registry tools live in `codifycli/codify-infrastructure` (`mastra/src/mastra/mcp/codify-mcp-server.ts`).
