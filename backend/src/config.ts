import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Configuration from environment variables (set them in cPanel → Setup Node.js App),
 * optionally overridden by a JSON file outside the web root:
 *   BK_CONFIG=/home/<user>/bk-private/config.json   or   ~/bk-private/config.json
 */
export type Config = {
  env: 'production' | 'development' | 'test';
  port: number;
  siteUrl: string;
  db: { host: string; port: number; name: string; user: string; pass: string; connectionLimit: number };
  appKey: Buffer;    // 32 bytes, AES-256-GCM encryption at rest
  indexKey: Buffer;  // 32 bytes, HMAC blind indexes and result tokens
  trustProxy: boolean;
  mail: {
    driver: 'sendmail' | 'smtp' | 'log';
    from: string; fromName: string; replyTo?: string;
    smtp?: { host: string; port: number; secure: boolean; user?: string; pass?: string };
    sendmailPath?: string; logDir?: string; fail?: boolean;
  };
  cronKey?: string;
  mediaDir: string;
};

let cached: Config | null = null;

function key(name: string, v: string | undefined, env: string): Buffer {
  if (!v) {
    if (env === 'test') return Buffer.alloc(32, name.length);
    throw new Error(`Missing ${name}. Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`);
  }
  const b = Buffer.from(v, 'base64');
  if (b.length !== 32) throw new Error(`${name} must be a base64-encoded 32-byte key`);
  return b;
}

export function loadConfig(): Config {
  if (cached) return cached;
  let file: Record<string, string> = {};
  const candidates = [process.env.BK_CONFIG, path.join(os.homedir(), 'bk-private', 'config.json')].filter(Boolean) as string[];
  for (const c of candidates) {
    if (fs.existsSync(c)) { file = JSON.parse(fs.readFileSync(c, 'utf8')); break; }
  }
  const get = (k: string, d?: string) => process.env[k] ?? file[k] ?? d;
  const env = (get('NODE_ENV', 'production') as Config['env']);
  cached = {
    env,
    port: Number(get('PORT', '3001')),
    siteUrl: (get('SITE_URL', 'https://blazekonzult.nl') as string).replace(/\/$/, ''),
    db: {
      host: get('DB_HOST', 'localhost')!, port: Number(get('DB_PORT', '3306')), name: get('DB_NAME', '')!,
      user: get('DB_USER', '')!, pass: get('DB_PASSWORD', get('DB_PASS', ''))!, connectionLimit: Number(get('DB_POOL', '5')),
    },
    appKey: key('APP_KEY', get('APP_KEY'), env),
    indexKey: key('INDEX_KEY', get('INDEX_KEY'), env),
    trustProxy: get('TRUST_PROXY', 'true') === 'true',
    mail: {
      driver: (get('MAIL_DRIVER', 'sendmail') as Config['mail']['driver']),
      from: get('MAIL_FROM', 'no-reply@blazekonzult.nl')!,
      fromName: get('MAIL_FROM_NAME', 'BlazeKonzult')!,
      replyTo: get('MAIL_REPLY_TO'),
      smtp: get('SMTP_HOST') ? {
        host: get('SMTP_HOST')!, port: Number(get('SMTP_PORT', '587')), secure: get('SMTP_SECURE', 'false') === 'true',
        user: get('SMTP_USER'), pass: get('SMTP_PASS'),
      } : undefined,
      sendmailPath: get('SENDMAIL_PATH', '/usr/sbin/sendmail'),
      logDir: get('MAIL_LOG_DIR', path.join(os.tmpdir(), 'bk-mail')),
      fail: get('MAIL_FAIL', 'false') === 'true',
    },
    cronKey: get('CRON_KEY'),
    mediaDir: get('MEDIA_DIR', path.join(os.homedir(), 'bk-media'))!,
  };
  return cached;
}

/** Tests only. */
export function setConfig(c: Partial<Config>): void { cached = { ...loadConfig(), ...c } as Config; }
export function resetConfig(): void { cached = null; }
