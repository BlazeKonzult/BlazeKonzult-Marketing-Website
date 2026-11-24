/**
 * First-run setup that runs on every server start (safe to repeat):
 * brings the schema up to date, installs the starter assessments if there are none,
 * and creates the first owner from BK_EMAIL / BK_NAME / BK_PASSWORD when no user exists yet.
 * Lets hosts without a terminal (GoDaddy app hosting) be set up with environment variables only.
 */
import { db, migrate } from './db';
import { seed } from './seed';
import { Password } from './security';
import { isEmail } from './http';

export async function bootstrap(log: (m: string) => void = console.log) {
  await migrate();
  log('database schema up to date');
  if (!Number(await db.val('SELECT COUNT(*) FROM templates'))) {
    const r = await seed({ force: false, publish: true });
    log(`starter assessments installed: ${JSON.stringify(r)}`);
  }
  if (!Number(await db.val('SELECT COUNT(*) FROM users'))) {
    const email = (process.env.BK_EMAIL ?? '').toLowerCase().trim();
    const pw = process.env.BK_PASSWORD ?? '';
    if (email && pw && isEmail(email)) {
      Password.validate(pw);
      await db.insert('users', { email, name: process.env.BK_NAME || email, role: 'owner', password_hash: Password.hash(pw) });
      log(`owner account created for ${email}; remove BK_PASSWORD from the settings now`);
    } else log('no admin user yet: set BK_EMAIL, BK_NAME and BK_PASSWORD and restart');
  }
}
