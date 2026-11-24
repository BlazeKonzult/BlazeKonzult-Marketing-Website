/* Regression tests for the existing platform features the Command Centre depends on. */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { start, stop, createUser, login, Client, db, base } from './helpers';

let owner: Client; let editor: Client;
before(async () => {
  await start();
  const o = await createUser('owner2@test.nl', 'owner'); const e = await createUser('editor2@test.nl', 'editor');
  owner = await login(o.email, o.password); editor = await login(e.email, e.password);
});
after(stop);

/** Answers that satisfy every question type of a published template. */
async function answersFor(slug: string, level: number) {
  const t = await db.one('SELECT current_version_id v FROM templates WHERE slug = ?', [slug]);
  const snap = JSON.parse((await db.one('SELECT snapshot FROM template_versions WHERE id = ?', [t!.v]))!.snapshot);
  const a: Record<string, unknown> = {};
  for (const q of snap.questions) {
    if (q.type === 'maturity') a[q.code] = level;
    else if (q.type === 'yes_no') a[q.code] = 'yes';
    else if (q.type === 'number') a[q.code] = q.min ?? 10;
    else if (q.options?.length) a[q.code] = q.type === 'multi' ? [q.options[0].value] : q.options[0].value;
  }
  return { version_id: t!.v, answers: a };
}

test('public catalogue lists the published assessments', async () => {
  const r = await fetch(`${base}/api/templates`);
  const j = await r.json();
  assert.ok(j.templates.length >= 5);
});

test('a full assessment is scored, stored encrypted, deduplicated and counted on the dashboard', async () => {
  const c = new Client();
  const slug = 'general-readiness';
  const exists = await db.val('SELECT id FROM templates WHERE slug = ?', [slug]);
  const s = exists ? slug : String(await db.val("SELECT slug FROM templates WHERE status = 'published' LIMIT 1"));
  const sess = await c.post('/sessions', { slug: s, locale: 'en' });
  assert.equal(sess.status, 200);
  const { version_id, answers } = await answersFor(s, 4);
  const body = { slug: s, version_id, answers, idempotency_key: crypto.randomUUID(), elapsed_ms: 120000, locale: 'en', session_id: sess.json.session_id };
  const r = await c.post('/submit', body);
  assert.equal(r.status, 200, r.text);
  assert.ok(r.json.result.overall >= 90, 'all answers at level 4 give a top score');
  const dup = await c.post('/submit', body);
  assert.equal(dup.json.duplicate, true, 'same idempotency key does not create a second record');
  const row = await db.one('SELECT answers_enc FROM assessments ORDER BY id DESC LIMIT 1');
  assert.ok(!row!.answers_enc.includes('"'), 'answers are not stored in plain JSON');
  const d = await owner.get('/admin/dashboard?period=today');
  assert.equal(d.json.kpis.current.completed, 1);
  const id = await db.val('SELECT id FROM assessments ORDER BY id DESC LIMIT 1');
  const re = await owner.post(`/admin/assessments/${id}/recompute`, {});
  assert.equal(re.json.reproducible, true, 'historical result is reproducible from its stored version');
});

test('too-fast submissions are rejected (bot protection)', async () => {
  const c = new Client();
  const s = String(await db.val("SELECT slug FROM templates WHERE status = 'published' LIMIT 1"));
  const { version_id, answers } = await answersFor(s, 2);
  const r = await c.post('/submit', { slug: s, version_id, answers, idempotency_key: crypto.randomUUID(), elapsed_ms: 500 });
  assert.equal(r.status, 400);
});

test('website content: save, revision, unsafe link rejected, reset; editors can edit, viewers cannot', async () => {
  const key = encodeURIComponent('page:contact');
  const save = await editor.put(`/admin/content/${key}`, { data: { seo: { title: 'Contact BlazeKonzult', description: 'Talk to us about cybersecurity.' } } });
  assert.equal(save.status, 200, save.text);
  assert.equal((await owner.get(`/admin/content/${key}`)).json.doc.data.seo.title, 'Contact BlazeKonzult');
  assert.ok((await owner.get(`/admin/content/${key}/revisions`)).json.revisions.length >= 1);
  const bad = await editor.put(`/admin/content/${key}`, { data: { cta: { label: 'Go', href: 'javascript:alert(1)' } } });
  assert.equal(bad.status, 422, 'javascript: link fields are refused (inline text links are filtered when rendered)');
  const bulk = await owner.get('/admin/content-bulk');
  assert.ok(bulk.json.docs.some((d: any) => d.doc_key === 'page:contact'));
  assert.equal((await editor.del(`/admin/content/${key}`)).status, 200);
  const v = await createUser('viewer2@test.nl', 'viewer'); const viewer = await login(v.email, v.password);
  assert.equal((await viewer.put(`/admin/content/${key}`, { data: {} })).status, 403);
});
