import PDFDocument from 'pdfkit';
import type { Request } from 'express';
import { db, now } from './db';
import { ApiError } from './http';
import { Crypto, RateLimit, Token } from './security';
import { Settings } from './settings';
import { Templates } from './templates';
import { Leads } from './leads';
import { index, options, Result } from './engine';
import { fmtDate, Loc, pick, PRIORITY, SERVICES, SPECIAL, t } from './i18n';

/**
 * Server-generated PDF readiness report (pdfkit, MIT). Built on demand from encrypted stored data
 * and the exact template version used, so no report files are stored or exposed at predictable URLs.
 */
const C = { navy: '#081421', purple: '#6D3BEA', purpleLight: '#B39DFA', body: '#334155', muted: '#5D6B80', line: '#DDE4EE', paper: '#F7F9FC' };
const LEVEL: Record<string, string> = { initial: '#D14343', developing: '#A35D00', established: '#1649A8', advanced: '#0B7D5E', highly_mature: '#0B7D5E' };
const clean = (s: string) => s.replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/[→]/g, '->');

export async function buildReport(a: any, lead: ReturnType<typeof Leads.decrypt> | null, l: Loc): Promise<Buffer> {
  const snap = await Templates.snapshotByVersion(a.version_id);
  const ver = await Templates.versionRow(a.version_id);
  const res = Crypto.decryptJson<Result>(a.result_enc)!;
  const answers = Crypto.decryptJson<Record<string, unknown>>(a.answers_enc) ?? {};
  const P = (v: any) => clean(pick(v, l));
  const company = await Settings.get('company');

  const doc = new PDFDocument({ size: 'A4', margins: { top: 70, bottom: 60, left: 50, right: 50 }, bufferPages: true,
    info: { Title: t('report_title', l), Author: 'BlazeKonzult', Creator: 'BlazeKonzult assessment platform' } });
  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
  const W = doc.page.width - 100;

  const ensure = (h: number) => { if (doc.y + h > doc.page.height - 70) doc.addPage(); };
  const h2 = (s: string) => {
    ensure(60);
    doc.moveDown(0.8).font('Helvetica-Bold').fontSize(14).fillColor(C.navy).text(clean(s), 50);
    const y = doc.y + 3; doc.moveTo(50, y).lineTo(92, y).lineWidth(2).strokeColor(C.purple).stroke();
    doc.moveDown(0.8);
  };
  const para = (s: string, size = 10, color = C.body, font = 'Helvetica') => doc.font(font).fontSize(size).fillColor(color).text(clean(s), 50, doc.y, { width: W, lineGap: 2 });

  // Title
  doc.font('Helvetica-Bold').fontSize(24).fillColor(C.navy).text(t('report_title', l), 50, 80, { width: W });
  doc.font('Helvetica').fontSize(12).fillColor(C.purple).text(P(snap.template.name)).moveDown(0.8);

  const meta: [string, string][] = [];
  if (lead) meta.push([t('prepared_for', l), [lead.company, lead.name].filter(Boolean).join(' · ')]);
  meta.push([t('date', l), fmtDate(a.created_at, l)]);
  meta.push([t('assessment', l), `${P(snap.template.name)} · ${t('version', l)} ${ver?.version ?? '-'}`]);
  meta.push([t('reference', l), a.public_ref]);
  for (const pk of ['company_size', 'industry', 'country']) {
    const q = snap.questions.find((q) => q.profile_key === pk);
    if (!q || answers[q.code] === undefined) continue;
    const v = answers[q.code];
    const label = v === 'unsure' ? pick(SPECIAL.unsure, l) : pick(options(q).find((o) => String(o.value) === String(v))?.label, l) || String(v);
    meta.push([t(pk, l), label]);
  }
  for (const [k, v] of meta) {
    const y = doc.y;
    doc.font('Helvetica').fontSize(9.5).fillColor(C.muted).text(clean(k), 50, y, { width: 110 });
    doc.font('Helvetica-Bold').fillColor(C.navy).text(clean(v), 165, y, { width: W - 115 });
    doc.moveDown(0.3);
  }

  // Score summary panel (text + ring; never colour alone)
  doc.moveDown(0.8);
  const py = doc.y;
  doc.roundedRect(50, py, W, 118, 6).fillAndStroke(C.paper, C.line);
  const cx = 110, cy = py + 59, r = 38;
  const color = LEVEL[res.classification?.key ?? ''] ?? C.purple;
  doc.lineWidth(9).strokeColor(C.line).circle(cx, cy, r).stroke();
  const pct = Math.max(0, Math.min(100, res.overall ?? 0));
  if (pct > 0) {
    const end = (-90 + 3.6 * Math.min(pct, 99.9)) * (Math.PI / 180);
    const large = pct > 50 ? 1 : 0;
    doc.path(`M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(end)} ${cy + r * Math.sin(end)}`).lineWidth(9).lineCap('round').strokeColor(color).stroke();
  }
  doc.font('Helvetica-Bold').fontSize(18).fillColor(C.navy).text(res.overall === null ? '-' : `${Math.round(res.overall)}%`, cx - 40, cy - 10, { width: 80, align: 'center' });
  doc.font('Helvetica').fontSize(9.5).fillColor(C.muted).text(t('overall', l), 175, py + 18);
  doc.font('Helvetica-Bold').fontSize(18).fillColor(color).text(res.classification ? P(res.classification.label) : '-', 175, doc.y + 2);
  doc.font('Helvetica').fontSize(9.5).fillColor(C.body)
    .text(`${t('coverage', l)}: ${Math.round(res.coverage)}%   ·   ${t('uncertainty', l)}: ${Math.round(res.uncertainty)}%`, 175, doc.y + 4);
  doc.fontSize(8.5).fillColor(C.muted).text(t('coverage_note', l), 175, doc.y + 4, { width: W - 135 });
  doc.y = py + 130;

  // Category scores
  h2(t('category_scores', l));
  for (const c of res.categories) {
    ensure(22);
    const y = doc.y;
    doc.font('Helvetica').fontSize(10).fillColor(C.navy).text(P(c.name), 50, y, { width: 165 });
    doc.rect(222, y + 4, 170, 5).fill(C.line);
    if (c.score !== null) doc.rect(222, y + 4, Math.max(2, 170 * c.score / 100), 5).fill(LEVEL[c.level?.key ?? ''] ?? C.purple);
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.navy)
      .text(c.score === null ? t('not_assessed', l) : `${Math.round(c.score)}% · ${P(c.level?.label)}`, 400, y, { width: W - 350, align: 'right' });
    doc.y = Math.max(doc.y, y + 18);
  }

  // Critical findings
  h2(t('critical_findings', l));
  para(t('critical_intro', l), 9, C.muted);
  doc.moveDown(0.4);
  if (!res.gaps.length) para(t('no_critical', l));
  for (const g of res.gaps) {
    ensure(30);
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#D14343').text(pick(PRIORITY[g.risk], l).toUpperCase(), 50, y + 1, { width: 62 });
    doc.font('Helvetica').fontSize(10).fillColor(C.navy).text(P(g.title) + (g.answer === 'unsure' ? ` (${pick(SPECIAL.unsure, l)})` : ''), 115, y, { width: W - 65 });
    doc.moveDown(0.4);
  }

  // Strengths
  h2(t('strengths', l));
  const catName = new Map(res.categories.map((c) => [c.key, c.name]));
  para(res.strengths.length ? res.strengths.map((k) => P(catName.get(k))).join(', ') + '.' : t('no_strengths', l));

  // Recommendations
  h2(t('recommendations', l));
  if (!res.recommendations.length) para(t('no_recommendations', l));
  res.recommendations.forEach((r, i) => {
    ensure(90);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(C.navy).text(`${i + 1}. ${P(r.title)}`, 50, doc.y, { width: W });
    doc.font('Helvetica').fontSize(8.5).fillColor(C.purple)
      .text([`${t('priority', l)}: ${pick(PRIORITY[r.priority], l)}`, P(catName.get(r.category) ?? { en: r.category }), r.timeframe ? `${t('timeframe', l)}: ${P(r.timeframe)}` : ''].filter(Boolean).join('  ·  '), { width: W });
    doc.moveDown(0.2);
    para(P(r.description), 9.5);
    if (r.impact) { doc.moveDown(0.2); para(`${t('impact', l)}: ${P(r.impact)}`, 9, C.muted); }
    if (r.remediation) { doc.moveDown(0.2); para(`${t('remediation', l)}: ${P(r.remediation)}`, 9, C.muted); }
    if (r.service) { doc.moveDown(0.2); para(`> ${pick(SERVICES[r.service], l)}`, 9, C.purple, 'Helvetica-Bold'); }
    doc.moveDown(0.7);
  });

  h2(t('next_steps', l));
  for (const k of ['next_1', 'next_2', 'next_3', 'next_4']) { para(`•  ${t(k, l)}`); doc.moveDown(0.2); }
  if (res.services.length) {
    h2(t('services', l));
    for (const s of res.services) { para(`•  ${pick(SERVICES[s], l)}  (blazekonzult.nl/${s})`); doc.moveDown(0.2); }
  }
  h2(t('limitations', l)); para(t('limitations_text', l), 9, C.muted);
  h2(t('privacy', l)); para(t('privacy_text', l), 9, C.muted);
  h2(t('contact', l)); para(`${company.name} · ${company.contact_url} · ${company.linkedin}`, 9.5);

  // Header + footer on every page
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const pw = doc.page.width, ph = doc.page.height;
    doc.save();
    doc.rect(0, 0, pw, 44).fill(C.navy);
    doc.roundedRect(50, 12, 20, 20, 4).fill(C.purple);
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF').text('K', 50, 17, { width: 20, align: 'center', lineBreak: false });
    doc.fontSize(13).fillColor('#FFFFFF').text('Blaze', 78, 15, { continued: true, lineBreak: false }).fillColor(C.purpleLight).text('Konzult', { lineBreak: false });
    doc.font('Helvetica').fontSize(8).fillColor('#C9D4E1').text(`${t('confidential', l)} · ${t('report_title', l)}`, pw - 300, 18, { width: 250, align: 'right', lineBreak: false });
    doc.moveTo(50, ph - 40).lineTo(pw - 50, ph - 40).lineWidth(0.5).strokeColor(C.line).stroke();
    doc.fontSize(7.5).fillColor(C.muted).text(`blazekonzult.nl · ${t('reference', l)} ${a.public_ref}`, 50, ph - 32, { lineBreak: false });
    doc.text(`${t('page', l)} ${i - range.start + 1}/${range.count}`, pw - 150, ph - 32, { width: 100, align: 'right', lineBreak: false });
    doc.restore();
  }
  doc.end();
  return done;
}

/** Secure report delivery: hashed, expiring, revocable tokens. */
export async function downloadReport(req: Request, token: unknown) {
  await RateLimit.hit(req, 'report', 30, 3600);
  if (!Token.valid(token)) throw new ApiError('This report link is invalid or has expired.', 'not_found', 404);
  const tk = await db.one('SELECT * FROM report_tokens WHERE token_hash = ?', [Token.hash(token)]);
  if (!tk || tk.revoked_at || new Date(tk.expires_at + 'Z').getTime() < Date.now()) throw new ApiError('This report link is invalid or has expired.', 'expired', 410);
  const a = await db.one('SELECT * FROM assessments WHERE id = ?', [tk.assessment_id]);
  if (!a) throw new ApiError('This report is no longer available.', 'not_found', 404);
  const lead = tk.lead_id ? await db.one('SELECT * FROM leads WHERE id = ?', [tk.lead_id]) : null;
  const ld = lead ? Leads.decrypt(lead) : null;
  const pdf = await buildReport(a, ld, (ld?.locale ?? a.locale) as Loc);
  await db.run('UPDATE report_tokens SET download_count = download_count + 1, last_download_at = ? WHERE id = ?', [now(), tk.id]);
  return { pdf, filename: `BlazeKonzult-readiness-report-${a.public_ref}.pdf` };
}

export { index };
