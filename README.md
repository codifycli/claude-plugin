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
- Node.js, used for the login helper
- The [Codify CLI](https://codifycli.com/docs), logged in with `codify login`

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

## Login

The MCP server needs a Codify login. `scripts/auth-headers.mjs` (a `headersHelper`) reads the token that `codify login` saved in `~/.codify/credentials.json`. Without a login, it uses the CLI's anonymous session (`~/.codify/anonymous-session.json`) if one exists. Claude Code runs the helper on every connection, and again after a 401.

Claude Code only runs the helper in a folder you have trusted. In non-interactive runs (`claude -p`) in a new folder, accept the trust dialog once interactively first.

If the tools stop working, run `codify login` and reconnect the server with `/mcp`.

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

Point it at another Codify agent server, such as a local `wrangler dev`, with `CODIFY_MCP_URL`:

```bash
CODIFY_MCP_URL=http://localhost:8787/api/mcp/codify/mcp claude --plugin-dir ./
```

Check the plugin files:

```bash
claude plugin validate ./
```

The registry tools live in `codifycli/codify-infrastructure` (`mastra/src/mastra/mcp/codify-mcp-server.ts`).
