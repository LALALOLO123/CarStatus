import { writeFileSync, readFileSync, existsSync } from 'node:fs';

// Where Smartcar OAuth tokens are cached. Gitignored — contains access + refresh tokens.
export const TOKEN_FILE = new URL('./smartcar_tokens.json', import.meta.url);

export function saveTokens(access) {
  writeFileSync(TOKEN_FILE, JSON.stringify(access, null, 2), 'utf8');
}

export function loadTokens() {
  if (!existsSync(TOKEN_FILE)) return null;
  const raw = JSON.parse(readFileSync(TOKEN_FILE, 'utf8'));
  // Revive Date fields that JSON stringified to ISO strings.
  if (raw.expiration) raw.expiration = new Date(raw.expiration);
  if (raw.refreshExpiration) raw.refreshExpiration = new Date(raw.refreshExpiration);
  return raw;
}
