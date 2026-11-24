import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { loadConfig } from './config';
import { db, now } from './db';
import { Crypto } from './security';
import { Settings } from './settings';
import { fmtDate, Loc, t } from './i18n';
import { isEmail } from './http';

/**
 * Outbox mailer: every email is stored encrypted first, sent immediately when possible and
 * retried with exponential backoff by cron on failure. Drivers: sendmail (cPanel), smtp, log (tests).
 */
export const BACKOFF = [300, 1800, 7200, 43200];
export const MAX_ATTEMPTS = 5;

let transport: nodemailer.Transporter | null = null;
function getTransport(): nodemailer.Transporter | null {
  const m = loadConfig().mail;
  if (m.driver === 'log') return null;
  if (transport) return transport;
  transport = m.driver === 'smtp' && m.smtp
    ? nodemailer.createTransport({ host: m.smtp.host, port: m.smtp.port, secure: m.smtp.secure, auth: m.smtp.user ? { user: m.smtp.user, pass: m.smtp.pass } : undefined, connectionTimeout: 15_000, greetingTimeout: 10_000, socketTimeout: 20_000 })
    : nodemailer.createTransport({ sendmail: true, newline: 'unix', path: m.sendmailPath });
  return transport;
}

async function deliver(to: string, subject: string, html: string, text: string): Promise<void> {
  const m = loadConfig().mail;
  if (!isEmail(to)) throw new Error('Invalid recipient');
  if (m.driver === 'log') {
    if (m.fail) throw new Error('Simulated delivery failure');
    fs.mkdirSync(m.logDir!, { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(m.logDir!, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`), JSON.stringify({ to, subject, html, text }));
    return;
  }
  // Never wait more than 25 seconds for a mail server (a missing or blocked server must not hang anything).
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Mail server did not respond within 25 seconds')), 25_000); });
  try { await Promise.race([getTransport()!.sendMail({ from: { name: m.fromName, address: m.from }, replyTo: m.replyTo ?? m.from, to, subject, html, text, headers: { 'Auto-Submitted': 'auto-generated' } }), timeout]); }
  finally { clearTimeout(timer); }
}

export const Mailer = {
  async queue(kind: string, to: string, subject: string, html: string, text: string, leadId: number | null = null, sendNow = true): Promise<number> {
    const id = await db.insert('email_outbox', { kind, to_enc: Crypto.encrypt(to), subject: subject.slice(0, 250), html_enc: Crypto.encrypt(html), text_enc: Crypto.encrypt(text), lead_id: leadId });
    // Send in the background: a sign-in, form submission or report request never waits for the
    // mail server. Failures stay queued and are retried by the cron job.
    if (sendNow) {
      const p = Mailer.attempt(id).catch((e) => { console.error(`[mail] #${id} background send failed: ${(e as Error).message}`); return false; });
      if (process.env.NODE_ENV === 'test') await p;
    }
    return id;
  },

  async attempt(id: number): Promise<boolean> {
    const m = await db.one("SELECT * FROM email_outbox WHERE id = ? AND status = 'queued'", [id]);
    if (!m) return false;
    const attempts = Number(m.attempts) + 1;
    try {
      await deliver(Crypto.decrypt(m.to_enc)!, m.subject, Crypto.decrypt(m.html_enc)!, Crypto.decrypt(m.text_enc)!);
      await db.update('email_outbox', { status: 'sent', attempts, sent_at: now(), last_error: null }, 'id = ?', [id]);
      return true;
    } catch (e) {
      const final = attempts >= MAX_ATTEMPTS;
      await db.update('email_outbox', {
        status: final ? 'failed' : 'queued', attempts, next_attempt_at: now(BACKOFF[Math.min(attempts - 1, BACKOFF.length - 1)]),
        last_error: String((e as Error).message).slice(0, 490),
      }, 'id = ?', [id]);
      console.error(`[mail] #${id} attempt ${attempts} failed: ${(e as Error).message}`);
      return false;
    }
  },

  async processQueue(limit = 20) {
    const ids = await db.all<{ id: number }>(`SELECT id FROM email_outbox WHERE status = 'queued' AND next_attempt_at <= ? ORDER BY id LIMIT ${Math.max(1, Math.min(200, limit))}`, [now()]);
    let sent = 0, failed = 0;
    for (const r of ids) (await Mailer.attempt(r.id)) ? sent++ : failed++;
    return { sent, failed };
  },
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Branded, table-based HTML email with a plain-text alternative. */
export function renderEmail(l: Loc, heading: string, paragraphs: string[], button: { label: string; url: string } | null = null, after: string[] = [], participant = true): [string, string] {
  const p = paragraphs.map((x) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155">${esc(x)}</p>`).join('');
  const btn = button ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:6px;background:#6D3BEA"><a href="${esc(button.url)}" style="display:inline-block;padding:13px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">${esc(button.label)}</a></td></tr></table>` : '';
  const a = after.map((x) => `<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#5D6B80">${esc(x).replace(/\n/g, '<br>')}</p>`).join('');
  const footer = participant ? t('email_footer', l) : 'BlazeKonzult internal notification. Do not forward.';
  const html = `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(heading)}</title></head>`
    + `<body style="margin:0;background:#F7F9FC;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;padding:24px 12px"><tr><td align="center">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #DDE4EE;border-radius:10px;overflow:hidden">`
    + `<tr><td style="background:#081421;padding:20px 28px"><span style="display:inline-block;width:26px;height:26px;border-radius:6px;background:#6D3BEA;color:#fff;font-weight:700;text-align:center;line-height:26px;font-size:15px">K</span><span style="font-size:18px;font-weight:700;color:#ffffff;vertical-align:middle;margin-left:8px">Blaze<span style="color:#B39DFA">Konzult</span></span></td></tr>`
    + `<tr><td style="padding:32px 28px 12px"><h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#0B1726">${esc(heading)}</h1>${p}${btn}${a}</td></tr>`
    + `<tr><td style="padding:18px 28px;border-top:1px solid #DDE4EE;font-size:12px;line-height:1.5;color:#5D6B80">${esc(footer)}<br>BlazeKonzult · blazekonzult.nl</td></tr></table></td></tr></table></body></html>`;
  const text = `${heading}\n\n${paragraphs.join('\n\n')}${button ? `\n\n${button.label}: ${button.url}` : ''}${after.length ? `\n\n${after.join('\n\n')}` : ''}\n\n--\n${footer}\nBlazeKonzult · blazekonzult.nl\n`;
  return [html, text];
}

/** Which emails go out when. Admin notifications never contain detailed security findings. */
export const Notifications = {
  async leadCreated(o: { leadId: number; isNew: boolean; name: string; email: string; company: string; locale: Loc; wantsReport: boolean; wantsConsult: boolean; download: { url: string; expires_at: string } | null; priority: string }) {
    const sign = `${t('email_signoff', o.locale)}\nBlazeKonzult`;
    if (await Settings.get('participant_emails')) {
      const greet = t('email_greeting', o.locale, o.name);
      if (o.wantsReport && o.download) {
        const [h, tx] = renderEmail(o.locale, t('email_report_subject', o.locale), [greet, t('email_report_body', o.locale)],
          { label: t('email_report_button', o.locale), url: o.download.url }, [t('email_report_expiry', o.locale, fmtDate(o.download.expires_at, o.locale)), sign]);
        await Mailer.queue('participant_report', o.email, t('email_report_subject', o.locale), h, tx, o.leadId);
      } else {
        const [h, tx] = renderEmail(o.locale, t('email_confirm_subject', o.locale), [greet, t('email_confirm_body', o.locale)], null, [sign]);
        await Mailer.queue('participant_confirmation', o.email, t('email_confirm_subject', o.locale), h, tx, o.leadId);
      }
      if (o.wantsConsult) {
        const [h, tx] = renderEmail(o.locale, t('email_consult_subject', o.locale), [greet, t('email_consult_body', o.locale)], null, [sign]);
        await Mailer.queue('participant_consultation', o.email, t('email_consult_subject', o.locale), h, tx, o.leadId);
      }
    }
    if (o.isNew) await Notifications.notifyAdmins(o.leadId, o.company, o.priority, o.wantsConsult, 'assessment');
  },

  async notifyAdmins(leadId: number, company: string, priority: string, consult: boolean, source: string) {
    const to = ((await Settings.get('notify_emails')) ?? []).filter(isEmail);
    if (!to.length) return;
    if ((await Settings.get('notify_high_priority_only')) && priority !== 'high') return;
    if (consult ? !(await Settings.get('notify_on_consultation')) && !(await Settings.get('notify_on_new_lead')) : !(await Settings.get('notify_on_new_lead'))) return;
    const ref = await db.val<string>('SELECT public_ref FROM leads WHERE id = ?', [leadId]);
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const subject = `${consult ? 'New consultation request' : `New ${source} lead`} · ${cap(priority)} priority · ${ref}`;
    const url = `${loadConfig().siteUrl}/admin/#/leads/${leadId}`;
    const [h, tx] = renderEmail('en', consult ? 'New consultation request' : 'New lead received', [
      `Source: ${cap(source)}. Company: ${company || 'not provided'}. Commercial priority: ${cap(priority)}.`,
      'Contact details and assessment findings are only available in the secure dashboard.',
    ], { label: 'Open in dashboard', url }, [], false);
    for (const addr of to) await Mailer.queue(consult ? 'admin_consultation' : 'admin_new_lead', addr, subject, h, tx, leadId);
  },
};
