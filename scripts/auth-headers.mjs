#!/usr/bin/env node
// headersHelper for the Codify MCP server. Claude Code runs this on every connection (and again after a 401) and
// sends the JSON it prints as HTTP headers.
//
// It reuses the Codify CLI's login: `codify login` saves the token to ~/.codify/credentials.json. Without a login it
// falls back to the CLI's anonymous session (~/.codify/anonymous-session.json, created by `codify prompt`), if that
// session hasn't expired.
//
// Claude Code strips variables that look like credentials (TOKEN, KEY, ...) from this script's environment, so
// tokens are only read from files.
import {readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';

const codifyDir = join(homedir(), '.codify');
const now = Date.now() / 1000;

function readJson(file) {
  try {
    return JSON.parse(readFileSync(join(codifyDir, file), 'utf8'));
  } catch {
    return undefined;
  }
}

// Expiry (seconds) from the JWT itself, without verifying it: the server does that.
function jwtExpiry(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp : undefined;
  } catch {
    return undefined;
  }
}

function findToken() {
  const credentials = readJson('credentials.json');
  if (typeof credentials?.accessToken === 'string') {
    const exp = jwtExpiry(credentials.accessToken);
    if (exp === undefined || exp > now) return credentials.accessToken;
  }

  const anonymous = readJson('anonymous-session.json');
  if (typeof anonymous?.accessToken === 'string' && (anonymous.expiresAt ?? 0) > now) {
    return anonymous.accessToken;
  }

  return undefined;
}

const token = findToken();
if (!token) {
  process.stderr.write('Codify: not logged in, or the login expired. Run `codify login` and reconnect with /mcp.\n');
  process.stdout.write('{}');
} else {
  process.stdout.write(JSON.stringify({Authorization: `Bearer ${token}`}));
}
