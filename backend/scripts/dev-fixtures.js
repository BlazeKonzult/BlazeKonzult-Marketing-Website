/**
 * DEVELOPMENT FIXTURES ONLY. Fills a local preview database with clearly labelled demo records
 * (every company name ends in "(demo)") so the Command Centre can be reviewed with data.
 * Refuses to run in production or against a database whose name does not look local.
 *   node scripts/dev-fixtures.js            add demo data
 *   node scripts/dev-fixtures.js --remove   delete all demo data again
 */
const crypto = require('crypto');
const { loadConfig } = require('../dist/config');
const { db, closePool, now } = require('../dist/db');
const { Crypto, Token } = require('../dist/security');
const { evaluate, validate } = require('../dist/engine');

const cfg = loadConfig();
if (cfg.env === 'production') { console.error('Refusing to run: NODE_ENV is production.'); process.exit(1); }
if (!/(dev|local|test|preview)/i.test(cfg.db.name)) { console.error(`Refusing to run against database "${cfg.db.name}" (name must contain dev, local, test or preview).`); process.exit(1); }

const ts = (daysAgo, hour = 10) => { const d = new Date(Date.now() - daysAgo * 86400_000); d.setUTCHours(hour, Math.floor(Math.random() * 60), 0, 0); return d.toISOString().slice(0, 19).replace('T', ' '); };
const pick = (a, i) => a[i % a.length];
let seq = 0;
const ref = () => `DEMO${Date.now().toString(36).slice(-4)}${(seq++).toString(36).padStart(4, '0')}`.toUpperCase().slice(0, 12);

async function remove() {
  const leads = await db.all("SELECT id, assessment_id FROM leads WHERE public_ref LIKE 'DEMO%'");
  for (const l of leads) { await db.run('DELETE FROM lead_notes WHERE lead_id = ?', [l.id]); await db.run('DELETE FROM email_outbox WHERE lead_id = ?', [l.id]); }
  await db.run("DELETE FROM leads WHERE public_ref LIKE 'DEMO%'");
  await db.run("DELETE FROM assessments WHERE public_ref LIKE 'DEMO%'");
  await db.run("DELETE FROM assessment_sessions WHERE public_id LIKE 'demo%'");
  await db.run("DELETE FROM audit_log WHERE meta LIKE '%\"demo\":true%'");
  console.log(`Removed demo data (${leads.length} leads).`);
}

async function add() {
  const templates = await db.all("SELECT t.id, t.slug, (SELECT id FROM template_versions v WHERE v.template_id = t.id ORDER BY id DESC LIMIT 1) vid FROM templates t WHERE t.status = 'published'");
  if (!templates.length) throw new Error('Seed the assessments first: node dist/cli.js seed');
  const owner = await db.one("SELECT id FROM users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const industries = ['manufacturing', 'logistics', 'healthcare', 'professional_services', 'it_services', 'saas'];
  const sizes = ['10-49', '50-249', '1-9', '250+'];
  const cats = ['governance', 'identity', 'infrastructure', 'data', 'incident', 'awareness'];
  const gaps = ['iam_privileged_mfa', 'data_restore_test', 'ir_plan', 'gov_risk_assessment', ''];
  const services = ['cybersecurity-health-check', 'nis2-readiness', 'virtual-ciso', 'incident-response-readiness', 'security-awareness-training'];
  const assessIds = [];
  for (let i = 0; i < 46; i++) {
    const day = Math.floor(Math.random() * 110);
    const t = pick(templates, i);
    const done = i % 5 !== 0;
    await db.insert('assessment_sessions', { public_id: `demo${crypto.randomBytes(14).toString('hex')}`, template_id: t.id, version_id: t.vid, started_at: ts(day), last_seen_at: ts(day), completed_at: done ? ts(day) : null, max_step: done ? 9 : 1 + (i % 6) });
    if (!done) continue;
    // Real engine output from generated answers, so result pages look exactly like production ones.
    const snap = JSON.parse((await db.one('SELECT snapshot FROM template_versions WHERE id = ?', [t.vid])).snapshot);
    const bias = (i * 37) % 5; // 0..4 maturity tendency per organisation
    const answers = {};
    for (const q of snap.questions) {
      const r = (i * 31 + q.code.length * 7) % 10;
      if (q.type === 'maturity') answers[q.code] = q.allow_unsure && r === 9 ? 'unsure' : Math.max(0, Math.min(4, bias + (r % 3) - 1));
      else if (q.type === 'number') answers[q.code] = Math.round(((q.min ?? 1) + (q.max ?? 100)) / 3);
      else if (q.options && q.options.length) { const o = q.options[(r + bias) % q.options.length]; answers[q.code] = q.type === 'multi' ? [o.value] : o.value; }
    }
    const [clean] = validate(snap, answers);
    const result = evaluate(snap, clean);
    const p = result.profile || {};
    const id = await db.insert('assessments', {
      public_ref: ref(), token_hash: Token.generate()[1], idempotency_key: crypto.randomUUID(), template_id: t.id, version_id: t.vid, locale: i % 4 ? 'en' : 'nl',
      answers_enc: Crypto.encryptJson(clean), result_enc: Crypto.encryptJson(result),
      overall_score: result.overall, classification: result.classification ? result.classification.key : null, coverage: result.coverage, uncertainty: result.uncertainty,
      category_scores: JSON.stringify(Object.fromEntries(result.categories.map((c) => [c.key, c.score]))), gap_codes: result.gaps.map((g) => g.code).join(',') || null,
      industry: typeof p.industry === 'string' ? p.industry : pick(industries, i), company_size: typeof p.company_size === 'string' ? p.company_size : pick(sizes, i), country: 'NL', result_expires_at: now(86400 * 90), created_at: ts(day),
    });
    assessIds.push([id, day]);
  }
  const people = [['Sanne de Vries', 'Example Logistics BV (demo)'], ['Daan Jansen', 'Sample Manufacturing BV (demo)'], ['Emma Bakker', 'Demo Health Clinic (demo)'], ['Lucas Visser', 'Placeholder Legal NV (demo)'], ['Julia Smit', 'Test SaaS BV (demo)'], ['Noah Meijer', 'Fictional Foods BV (demo)'], ['Tess Mulder', 'Example IT Services (demo)'], ['Sem de Boer', 'Sample Transport BV (demo)'], ['Lotte Bos', 'Demo Architects (demo)'], ['Finn Dekker', 'Example Engineering BV (demo)'], ['Eva Vos', 'Sample Retail BV (demo)'], ['Liam Peters', 'Demo Accountancy (demo)'], ['Zoë Hendriks', 'Example Care Group (demo)'], ['Milan van Leeuwen', 'Test Logistics Hub (demo)'], ['Saar Dijkstra', 'Fictional Fintech BV (demo)'], ['Levi Smits', 'Sample Software BV (demo)'], ['Nora de Graaf', 'Demo Pharma Supplies (demo)'], ['Jesse van Dijk', 'Example Energy BV (demo)']];
  const statuses = ['new', 'new', 'new', 'contacted', 'contacted', 'qualified', 'qualified', 'consultation_scheduled', 'consultation_scheduled', 'proposal_sent', 'converted', 'closed'];
  const sources = ['assessment', 'assessment', 'contact', 'assessment', 'checklist', 'contact', 'assessment', 'newsletter'];
  const users = await db.all('SELECT id FROM users WHERE active = 1');
  for (let i = 0; i < people.length; i++) {
    const [name, company] = people[i];
    const src = pick(sources, i);
    const a = src === 'assessment' ? assessIds[i * 2 % assessIds.length] : null;
    const day = a ? a[1] : Math.floor(Math.random() * 100);
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`;
    const status = pick(statuses, i);
    const id = await db.insert('leads', {
      public_ref: ref(), source: src, assessment_id: a ? a[0] : null, status, priority: pick(['high', 'medium', 'low', 'medium'], i), priority_score: 20 + (i * 7) % 60,
      name_enc: Crypto.encrypt(name), company_enc: Crypto.encrypt(company), email_enc: Crypto.encrypt(email), email_hash: Crypto.blindIndex(email),
      phone_enc: i % 3 ? Crypto.encrypt('+31 20 000 00' + String(10 + i)) : null, job_title_enc: Crypto.encrypt(pick(['Managing director', 'IT manager', 'Operations director', 'CFO'], i)),
      message_enc: src === 'contact' ? Crypto.encrypt('Demo message: we would like to discuss a cybersecurity health check for our office and warehouse.') : null,
      details: JSON.stringify({ contact_method: pick(['email', 'phone'], i), timeframe: pick(['within 1 month', '1-3 months', 'exploring'], i), company_size: pick(sizes, i), industry: pick(industries, i), interests: [pick(services, i)] }),
      wants_report: src === 'assessment' ? 1 : 0, wants_consultation: i % 3 === 0 ? 1 : 0, consent_privacy_at: ts(day), consent_marketing: i % 4 === 0 ? 1 : 0,
      assigned_to: i % 2 && users.length ? pick(users, i).id : null, locale: i % 5 ? 'en' : 'nl', created_at: ts(day), updated_at: ts(Math.max(0, day - 3)),
      next_follow_up_at: ['contacted', 'qualified', 'consultation_scheduled', 'proposal_sent'].includes(status) ? ts(i % 2 ? -3 - i % 5 : 1 + i % 3, 9) : null,
      last_contacted_at: status !== 'new' ? ts(Math.max(0, day - 2)) : null,
    });
    if (status !== 'new') {
      await db.insert('lead_notes', { lead_id: id, user_id: owner ? owner.id : null, note_enc: Crypto.encrypt('Demo note: introductory call held; they want a proposal for a health check.'), created_at: ts(Math.max(0, day - 2)) });
      await db.insert('audit_log', { user_id: owner ? owner.id : null, action: 'lead.update', entity: 'lead', entity_id: String(id), meta: JSON.stringify({ from: { status: 'new' }, to: { status }, demo: true }), created_at: ts(Math.max(0, day - 2)) });
    }
    await db.insert('email_outbox', { kind: 'lead_notification', to_enc: Crypto.encrypt('owner@example.com'), subject: 'New lead', html_enc: Crypto.encrypt('<p>demo</p>'), text_enc: Crypto.encrypt('demo'), status: i === 4 ? 'failed' : 'sent', attempts: i === 4 ? 5 : 1, last_error: i === 4 ? 'Demo failure: connection refused by mail server' : null, lead_id: id, created_at: ts(day), sent_at: i === 4 ? null : ts(day) });
  }
  console.log(`Added demo data: ${assessIds.length} assessments, 46 sessions, ${people.length} leads. Remove with --remove.`);
}

(async () => { try { if (process.argv.includes('--remove')) await remove(); else await add(); } catch (e) { console.error(e.message); process.exitCode = 1; } finally { await closePool(); } })();
