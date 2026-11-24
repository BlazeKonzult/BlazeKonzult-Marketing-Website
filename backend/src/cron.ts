/* Scheduled job (cPanel Cron Jobs, e.g. every 15 minutes): retries queued emails; once a day runs data retention. */
import { closePool } from './db';
import { Mailer } from './mailer';
import { runRetention } from './analytics';
import { db } from './db';

async function main() {
  const mail = await Mailer.processQueue(100);
  const out: Record<string, unknown> = { mail };
  const today = new Date().toISOString().slice(0, 10);
  const ran = await db.val<string>("SELECT `value` FROM settings WHERE `key` = '_retention_last_run'");
  if (process.argv.includes('--retention') || ran !== JSON.stringify(today)) {
    out.retention = await runRetention(null);
    await db.run("INSERT INTO settings (`key`, `value`) VALUES ('_retention_last_run', ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)", [JSON.stringify(today)]);
  }
  console.log(new Date().toISOString(), JSON.stringify(out));
}
main().catch((e) => { console.error(e?.message ?? e); process.exitCode = 1; }).finally(() => closePool());
