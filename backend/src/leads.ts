import type { Request } from 'express';
import { loadConfig } from './config';
import { db, now } from './db';
import { ApiError, bool, isEmail, locale, oneLine, str } from './http';
import { botCheck, Crypto, RateLimit, Token } from './security';
import { Settings, SettingsShape } from './settings';
import { Assessments } from './assessments';
import { Notifications } from './mailer';
import { SERVICES } from './i18n';

export const STATUSES = ['new', 'contacted', 'qualified', 'consultation_scheduled', 'proposal_sent', 'converted', 'closed'] as const;
const CONTACT_METHODS = ['email', 'phone', 'either'];
const TIMEFRAMES = ['immediate', '30_days', '3_months', 'exploring'];

/**
 * Commercial priority. Deliberately independent of security maturity: a low score alone
 * never makes a high-value lead. Inputs: consultation interest, company size, timeframe, stated interests.
 */
export function qualify(d: { wants_consultation?: boolean; wants_report?: boolean; company_size?: string | null; timeframe?: string | null; interests?: string[] }, c: SettingsShape['lead_scoring']): ['high' | 'medium' | 'low', number] {
  let score = d.wants_consultation ? c.consultation : d.wants_report ? c.report_only : 0;
  score += c.company_size[d.company_size ?? ''] ?? 0;
  score += c.timeframe[d.timeframe ?? ''] ?? 0;
  score += Math.min(c.max_interest, (d.interests?.length ?? 0) * c.per_interest);
  return [score >= c.high ? 'high' : score >= c.medium ? 'medium' : 'low', score];
}

export const reportUrl = (token: string) => `${loadConfig().siteUrl}/api/report?t=${token}`;

function email(body: any): string {
  const e = oneLine(str(body, 'email', 190, true))!.toLowerCase();
  if (!isEmail(e)) throw new ApiError('Please enter a valid email address.', 'validation', 422, { field: 'email' });
  return e;
}

export const Leads = {
  /** Lead from an assessment result. Results are visible without this; contact details are only requested here. */
  async fromAssessment(req: Request, body: any) {
    botCheck(body, 2);
    await RateLimit.hit(req, 'lead', 10, 3600);
    const a = await Assessments.rowByToken(String(body?.token ?? ''));
    const mail = email(body);
    const name = oneLine(str(body, 'name', 120, true))!;
    const company = oneLine(str(body, 'company', 160, true))!;
    const phone = oneLine(str(body, 'phone', 40));
    if (phone && !/^[0-9 +().-]{6,40}$/.test(phone)) throw new ApiError('Please enter a valid phone number.', 'validation', 422, { field: 'phone' });
    const job = oneLine(str(body, 'job_title', 120));
    const method = CONTACT_METHODS.includes(body?.contact_method) ? body.contact_method : 'email';
    const wantsReport = bool(body?.wants_report), wantsConsult = bool(body?.wants_consultation), discuss = bool(body?.discuss_gaps);
    if (!wantsReport && !wantsConsult && !discuss) throw new ApiError('Choose at least one option.', 'validation', 422, { field: 'intent' });
    if (!bool(body?.consent_privacy)) throw new ApiError('Please acknowledge the privacy notice.', 'validation', 422, { field: 'consent_privacy' });
    const timeframe = TIMEFRAMES.includes(body?.timeframe) ? body.timeframe : null;
    const interests = (Array.isArray(body?.interests) ? body.interests : []).map(String).filter((s: string) => s in SERVICES).slice(0, 7);
    const message = str(body, 'message', 2000);
    const l = locale(body?.locale ?? a.locale);
    const consult = wantsConsult || discuss;

    const details = { contact_method: method, timeframe, interests, company_size: a.company_size, industry: a.industry, discuss_gaps: discuss, need: wantsConsult ? 'consultation' : discuss ? 'discuss_gaps' : 'report' };
    const [priority, pscore] = qualify({ ...details, wants_consultation: consult, wants_report: wantsReport }, await Settings.get('lead_scoring'));
    const emailHash = Crypto.blindIndex(mail);
    const marketing = bool(body?.consent_marketing);
    const row = {
      name_enc: Crypto.encrypt(name), company_enc: Crypto.encrypt(company), email_enc: Crypto.encrypt(mail), email_hash: emailHash,
      phone_enc: Crypto.encrypt(phone), job_title_enc: Crypto.encrypt(job), message_enc: Crypto.encrypt(message), details: JSON.stringify(details),
      wants_report: wantsReport ? 1 : 0, wants_consultation: consult ? 1 : 0, priority, priority_score: pscore, locale: l,
      consent_privacy_at: now(), consent_marketing: marketing ? 1 : 0, consent_marketing_at: marketing ? now() : null,
    };
    // A repeat submission for the same assessment + email updates the lead instead of duplicating it
    const dup = await db.one('SELECT id, public_ref FROM leads WHERE assessment_id = ? AND email_hash = ?', [a.id, emailHash]);
    let leadId: number, ref: string, isNew: boolean;
    if (dup) { await db.update('leads', row, 'id = ?', [dup.id]); leadId = dup.id; ref = dup.public_ref; isNew = false; }
    else { ref = Token.ref(); leadId = await db.insert('leads', { ...row, public_ref: ref, source: 'assessment', assessment_id: a.id }); isNew = true; }

    let download: { url: string; expires_at: string } | null = null;
    if (wantsReport) {
      const [tok, hash] = Token.generate();
      const expires = now(86400 * (await Settings.get('report_link_days')));
      await db.insert('report_tokens', { assessment_id: a.id, lead_id: leadId, token_hash: hash, expires_at: expires });
      download = { url: reportUrl(tok), expires_at: expires };
    }
    await Notifications.leadCreated({ leadId, isNew, name, email: mail, company, locale: l, wantsReport, wantsConsult: consult, download, priority });
    return { ok: true, reference: ref, report: download };
  },

  /** Enquiries from other website forms feed the same lead pipeline. */
  async fromForm(req: Request, body: any) {
    const type = ['contact', 'checklist', 'newsletter'].includes(body?.formType) ? body.formType : 'contact';
    if (body?.website) return { ok: true }; // honeypot: pretend success
    await RateLimit.hit(req, 'form', 5, 600);
    const mail = email(body);
    const name = oneLine(str(body, 'name', 120, type !== 'newsletter'));
    const company = oneLine(str(body, 'company', 160, type !== 'newsletter'));
    if (type !== 'newsletter' && !bool(body?.consent)) throw new ApiError('Please confirm your consent.', 'validation', 422, { field: 'consent' });
    const sizeMap: Record<string, string> = { '1–10': '1-9', '11–50': '10-49', '51–250': '50-249', '250+': '250+' };
    const urgMap: Record<string, string> = { Immediate: 'immediate', 'Within 30 days': '30_days', 'Within three months': '3_months', Exploring: 'exploring' };
    if (type === 'contact') for (const f of ['companySize', 'sector', 'primaryNeed', 'urgency']) str(body, f, 80, true);
    const details = {
      contact_method: 'email', company_size: sizeMap[body?.companySize] ?? null, sector: str(body, 'sector', 80),
      need: str(body, 'primaryNeed', 80) ?? str(body, 'resource', 120) ?? (type === 'newsletter' ? 'newsletter' : null),
      timeframe: urgMap[body?.urgency] ?? null, phone_given: !!body?.phone,
    };
    const consult = type === 'contact';
    const [priority, pscore] = qualify({ wants_consultation: consult, company_size: details.company_size, timeframe: details.timeframe, interests: [] }, await Settings.get('lead_scoring'));
    const ref = Token.ref();
    const leadId = await db.insert('leads', {
      public_ref: ref, source: type, priority, priority_score: pscore,
      name_enc: Crypto.encrypt(name), company_enc: Crypto.encrypt(company), email_enc: Crypto.encrypt(mail), email_hash: Crypto.blindIndex(mail),
      phone_enc: Crypto.encrypt(oneLine(str(body, 'phone', 40))), message_enc: Crypto.encrypt(str(body, 'message', 5000)),
      details: JSON.stringify(details), wants_consultation: consult ? 1 : 0, wants_report: type === 'checklist' ? 1 : 0,
      consent_privacy_at: now(), consent_marketing: type === 'newsletter' ? 1 : 0, consent_marketing_at: type === 'newsletter' ? now() : null, locale: locale(body?.locale),
    });
    await Notifications.notifyAdmins(leadId, company ?? '', priority, consult, type);
    return { ok: true };
  },

  decrypt(l: any) {
    return {
      id: l.id, ref: l.public_ref, source: l.source, status: l.status, priority: l.priority, priority_score: l.priority_score,
      name: Crypto.decrypt(l.name_enc), company: Crypto.decrypt(l.company_enc), email: Crypto.decrypt(l.email_enc),
      phone: Crypto.decrypt(l.phone_enc), job_title: Crypto.decrypt(l.job_title_enc), message: Crypto.decrypt(l.message_enc),
      details: l.details ? JSON.parse(l.details) : {}, wants_report: !!l.wants_report, wants_consultation: !!l.wants_consultation,
      consent_privacy_at: l.consent_privacy_at, consent_marketing: !!l.consent_marketing, assigned_to: l.assigned_to,
      assessment_id: l.assessment_id, locale: l.locale, created_at: l.created_at, updated_at: l.updated_at,
      next_follow_up_at: l.next_follow_up_at ?? null, last_contacted_at: l.last_contacted_at ?? null,
    };
  },

  /** GDPR export: everything held about a lead, decrypted. */
  async export(id: number) {
    const l = await db.one('SELECT * FROM leads WHERE id = ?', [id]);
    if (!l) throw new ApiError('Lead not found', 'not_found', 404);
    const out: any = { lead: Leads.decrypt(l) };
    out.notes = (await db.all('SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY id', [id])).map((n) => ({ created_at: n.created_at, note: Crypto.decrypt(n.note_enc) }));
    if (l.assessment_id) {
      const a = await db.one('SELECT * FROM assessments WHERE id = ?', [l.assessment_id]);
      if (a) out.assessment = { ref: a.public_ref, created_at: a.created_at, answers: Crypto.decryptJson(a.answers_enc), result: Crypto.decryptJson(a.result_enc) };
    }
    out.exported_at = now();
    return out;
  },

  /** Erase a lead and everything linked (assessment, report links, notes, queued emails). */
  async erase(id: number) {
    await db.tx(async (cx) => {
      const l = await db.one('SELECT assessment_id FROM leads WHERE id = ?', [id], cx);
      if (!l) throw new ApiError('Lead not found', 'not_found', 404);
      await db.run('DELETE FROM lead_notes WHERE lead_id = ?', [id], cx);
      await db.run('DELETE FROM email_outbox WHERE lead_id = ?', [id], cx);
      await db.run('DELETE FROM report_tokens WHERE lead_id = ?', [id], cx);
      if (l.assessment_id) {
        await db.run('DELETE FROM report_tokens WHERE assessment_id = ?', [l.assessment_id], cx);
        await db.run('DELETE FROM assessments WHERE id = ?', [l.assessment_id], cx);
      }
      await db.run('DELETE FROM leads WHERE id = ?', [id], cx);
    });
  },
};
