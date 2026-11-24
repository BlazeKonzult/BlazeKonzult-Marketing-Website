/* Command-line tasks: node dist/cli.js <migrate|seed|create-owner|retention|mail|generate-keys> */
import crypto from 'crypto';
import readline from 'readline';
import { closePool, db, migrate } from './db';
import { seed } from './seed';
import { Password } from './security';
import { isEmail } from './http';
import { runRetention } from './analytics';
import { Mailer } from './mailer';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : process.env[`BK_${name.toUpperCase().replace(/-/g, '_')}`];
}
async function ask(q: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  if (hidden) (rl as any)._writeToOutput = (s: string) => { if (s.includes(q)) process.stdout.write(s); };
  return new Promise((r) => rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); r(a.trim()); }));
}

async function main() {
  const cmd = process.argv[2];
  switch (cmd) {
    case 'generate-keys':
      console.log(`APP_KEY=${crypto.randomBytes(32).toString('base64')}\nINDEX_KEY=${crypto.randomBytes(32).toString('base64')}\nCRON_KEY=${crypto.randomBytes(24).toString('base64url')}`);
      console.log('\nStore these securely. Losing APP_KEY makes stored contact details unreadable.');
      return;
    case 'migrate': await migrate(); console.log('Database schema is up to date.'); return;
    case 'seed': {
      await migrate();
      const r = await seed({ force: process.argv.includes('--force'), publish: !process.argv.includes('--no-publish') });
      console.log('Seeded:', r);
      return;
    }
    case 'create-owner': {
      const email = (arg('email') ?? (await ask('Email: '))).toLowerCase();
      if (!isEmail(email)) throw new Error('Invalid email');
      const name = arg('name') ?? (await ask('Name: '));
      const pw = arg('password') ?? (await ask('Password (min 12 chars): ', true));
      Password.validate(pw);
      const existing = await db.val<number>('SELECT id FROM users WHERE email = ?', [email]);
      if (existing) await db.update('users', { role: 'owner', active: 1, password_hash: Password.hash(pw), failed_logins: 0, locked_until: null }, 'id = ?', [existing]);
      else await db.insert('users', { email, name: name || email, role: 'owner', password_hash: Password.hash(pw) });
      console.log(existing ? 'Existing user updated to owner.' : 'Owner account created.');
      return;
    }
    case 'reset-2fa': {
      const email = (arg('email') ?? (await ask('Email: '))).toLowerCase();
      const id = await db.val<number>('SELECT id FROM users WHERE email = ?', [email]);
      if (!id) throw new Error('No user with that email');
      const { Auth } = await import('./auth');
      await Auth.resetMfa(id, null);
      console.log('Two-factor sign-in reset. The user will set it up again at their next sign-in.');
      return;
    }
    case 'retention': console.log(await runRetention(null)); return;
    case 'mail': console.log(await Mailer.processQueue(100)); return;
    default:
      console.log('Usage: node dist/cli.js <migrate|seed [--force] [--no-publish]|create-owner [--email e --name n --password p]|reset-2fa --email e|retention|mail|generate-keys>');
      process.exitCode = 1;
  }
}
main().catch((e) => { console.error(e?.message ?? e); process.exitCode = 1; }).finally(() => closePool());
