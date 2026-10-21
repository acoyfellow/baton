// Token and gateway lookup. Reuses the odds setup on purpose: same scoped token
// (AI Gateway Run + Workers AI Read, one account), same Keychain entry.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface GatewayConfig {
  readonly accountId: string;
  readonly gateway: string;
}

const ODDS_DIR = join(homedir(), '.config', 'odds');
const CONFIG_FILE = join(ODDS_DIR, 'config.json');
const TOKEN_FILE = join(ODDS_DIR, 'token');
const KEYCHAIN_SERVICE = 'odds-gateway';

export function readConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  let file: Partial<GatewayConfig> = {};
  try {
    file = JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) as Partial<GatewayConfig>;
  } catch {
    file = {};
  }
  const accountId = env.DO_ACCOUNT_ID ?? env.ODDS_ACCOUNT_ID ?? file.accountId;
  const gateway = env.DO_GATEWAY ?? env.ODDS_GATEWAY ?? file.gateway ?? 'default';
  if (!accountId) throw new Error(`Set accountId in ${CONFIG_FILE} or DO_ACCOUNT_ID`);
  return { accountId, gateway };
}

function fromKeychain(): string | undefined {
  if (process.platform !== 'darwin') return undefined;
  try {
    const value = execFileSync('security', ['find-generic-password', '-a', process.env.USER ?? '', '-s', KEYCHAIN_SERVICE, '-w'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5_000,
    }).trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

function fromFile(): string | undefined {
  try {
    if ((statSync(TOKEN_FILE).mode & 0o077) !== 0) throw new Error(`${TOKEN_FILE} must be chmod 600`);
    return readFileSync(TOKEN_FILE, 'utf8').trim() || undefined;
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') return undefined;
    throw error;
  }
}

export function readToken(env: NodeJS.ProcessEnv = process.env): string {
  const token = env.DO_TOKEN?.trim() || env.ODDS_TOKEN?.trim() || fromKeychain() || fromFile();
  if (!token) {
    throw new Error(`No gateway token. Store one with: security add-generic-password -a "$USER" -s ${KEYCHAIN_SERVICE} -w`);
  }
  return token;
}

export function redact(text: string, secret: string): string {
  return secret ? text.split(secret).join('[redacted]') : text;
}
