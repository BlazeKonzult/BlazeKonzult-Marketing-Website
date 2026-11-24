import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, createUser, login, Client, db, now, addSession, addAssessment, addLead, base } from './helpers';
import { resolvePeriod, bucketKeys } from '../src/command';
import { normPath, validateRedirect } from '../src/redirects';

let owner: Client; let sales: Client; let editor: Client; let viewer: Client;
const day = (offsetDays: number, time = '10:00:00') => `${new Date(Date.now() + offsetDays * 86400_000).toISOString().slice(0, 10)} ${time}`;

before(async () => {
  await start((_req, res) => { res.statusCode = 200; res.end('site'); });
  const o = await createUser('owner@test.nl', 'owner');
  const s = await createUser('sales@test.nl', 'sales');
  const e = await createUser('editor@test.nl', 'editor');
  const v = await createUser('viewer@test.nl', 'viewer');
  owner = await login(o.email, o.password); sales = await login(s.email, s.password);
  editor = await login(e.email, e.password); viewer = await login(v.email, v.password);
});
after(stop);

describe('reporting periods', () => {
  const at = new Date('2026-11-24T15:00:00Z');
  test('last 7 days covers 7 calendar days up to today, with an equal previous period', () => {
    const p = resolvePeriod({ period: '7d' }, at);
    assert.equal(p.start.toISOString().slice(0, 10), '2026-11-18');
    assert.equal(p.end.toISOString().slice(0, 10), '2026-11-25');
    assert.equal(p.prevStart.toISOString().slice(0, 10), '2026-11-11');
    assert.equal(p.bucket, 'day');
    assert.equal(bucketKeys(p).length, 7);
  });
  test('this quarter and this year start on calendar boundaries', () => {
    assert.equal(resolvePeriod({ period: 'quarter' }, at).start.toISOString().slice(0, 10), '2026-10-01');
    const y = resolvePeriod({ period: 'year' }, at);
    assert.equal(y.start.toISOString().slice(0, 10), '2026-01-01');
    assert.equal(y.bucket, 'month');
  });
  test('custom ranges are validated', () => {
    assert.throws(() => resolvePeriod({ period: 'custom', from: '2026-02-01', to: '2026-01-01' }, at));
    assert.throws(() => resolvePeriod({ period: 'custom', from: 'nope', to: '2026-01-01' }, at));
    const p = resolvePeriod({ period: 'custom', from: '2026-01-01', to: '2026-01-31' }, at);
    assert.equal(bucketKeys(p).length, 31);
  });
  test('unknown periods fall back to 30 days', () => assert.equal(resolvePeriod({ period: 'x' }, at).key, '30d'));
});

describe('executive dashboard', () => {
  test('empty database: zero values and no invented rates', async () => {
    const r = await owner.get('/admin/dashboard?period=7d');
    assert.equal(r.status, 200);
    assert.equal(r.json.kpis.current.starts, 0);
    assert.equal(r.json.kpis.current.completion_rate, null, 'zero denominator gives null, not 0% or NaN');
    assert.equal(r.json.kpis.current.conversion_rate, null);
    assert.equal(r.json.has_history, false);
    assert.equal(r.json.series.keys.length, 7);
  });
  test('counts real records in the period and the previous period', async () => {
    await addSession(day(0), true); await addSession(day(-1), false); await addSession(day(-10), true);
    await addAssessment(day(0), { score: 60, services: ['virtual-ciso'], gaps: 'iam_mfa', cats: { governance: 50, identity: 70 } });
    await addLead(day(0), { consultation: true }); await addLead(day(-2), { source: 'contact', status: 'qualified' }); await addLead(day(-9), { status: 'converted' });
    const r = await owner.get('/admin/dashboard?period=7d');
    const c = r.json.kpis.current; const p = r.json.kpis.previous;
    assert.equal(c.starts, 2); assert.equal(c.completion_rate, 50);
    assert.equal(c.completed, 1); assert.equal(c.leads, 2); assert.equal(c.consultations, 1); assert.equal(c.enquiries, 1); assert.equal(c.qualified, 1);
    assert.equal(p.starts, 1); assert.equal(p.leads, 1); assert.equal(p.conversion_rate, 100);
    assert.equal(r.json.series.starts.reduce((a: number, b: number) => a + b, 0), 2);
    assert.equal(r.json.maturity.sample, 1);
    assert.deepEqual(r.json.maturity.services.map((s: any) => s.key), ['virtual-ciso']);
    assert.ok(r.json.pipeline.find((x: any) => x.status === 'new'));
  });
  test('custom range validation errors are returned as 422', async () => {
    const r = await owner.get('/admin/dashboard?period=custom&from=2026-02-01&to=2026-01-01');
    assert.equal(r.status, 422);
  });
  test('viewers can see aggregates but not lead names in the activity feed', async () => {
    await addLead(day(0), { company: 'Secret Company BV' });
    const v = await viewer.get('/admin/activity');
    assert.equal(v.status, 200);
    assert.ok(!JSON.stringify(v.json).includes('Secret Company BV'));
    const s = await sales.get('/admin/activity');
    assert.ok(JSON.stringify(s.json).includes('Secret Company BV'));
  });
});

describe('search and permissions', () => {
  test('lead search results only for roles with lead access', async () => {
    await addLead(day(0), { company: 'Findable Logistics BV' });
    const s = await sales.get('/admin/search?q=findable');
    assert.ok(s.json.results.some((x: any) => x.group === 'Leads'));
    const e = await editor.get('/admin/search?q=findable');
    assert.equal(e.status, 200);
    assert.ok(!e.json.results.some((x: any) => x.group === 'Leads'));
  });
  test('short queries return nothing', async () => assert.deepEqual((await owner.get('/admin/search?q=a')).json.results, []));
  test('pipeline, bulk and health are capability-checked', async () => {
    assert.equal((await editor.get('/admin/leads/pipeline')).status, 403);
    assert.equal((await viewer.post('/admin/leads/bulk', { ids: [1], status: 'closed' })).status, 403);
    assert.equal((await sales.get('/admin/health')).status, 403);
    assert.equal((await new Client().get('/admin/dashboard')).status, 401);
  });
  test('state-changing requests need the CSRF token', async () => {
    const c = new Client(); c.cookies = owner.cookies;
    assert.equal((await c.put('/admin/prefs', { prefs: { theme: 'dark' } })).status, 419);
  });
});

describe('CRM', () => {
  test('pipeline lists open leads; bulk update changes status and writes audit entries', async () => {
    const a = await addLead(day(0)); const b = await addLead(day(0));
    const pl = await sales.get('/admin/leads/pipeline');
    assert.ok(pl.json.leads.some((l: any) => l.id === a));
    const r = await sales.post('/admin/leads/bulk', { ids: [a, b, 999999], status: 'contacted' });
    assert.equal(r.status, 200); assert.equal(r.json.changed, 2);
    const row = await db.one('SELECT status, last_contacted_at FROM leads WHERE id = ?', [a]);
    assert.equal(row!.status, 'contacted'); assert.ok(row!.last_contacted_at, 'moving to contacted records the contact date');
    assert.equal(Number(await db.val("SELECT COUNT(*) FROM audit_log WHERE action = 'lead.update' AND entity_id IN (?, ?)", [String(a), String(b)])), 2);
    assert.equal((await sales.post('/admin/leads/bulk', { ids: [a], status: 'bogus' })).status, 422);
    assert.equal((await sales.post('/admin/leads/bulk', { ids: [] , status: 'closed' })).status, 422);
  });
  test('follow-up dates are validated and appear in the timeline and attention list', async () => {
    const id = await addLead(day(-5));
    assert.equal((await sales.patch(`/admin/leads/${id}`, { next_follow_up_at: 'tomorrow' })).status, 422);
    const ok = await sales.patch(`/admin/leads/${id}`, { next_follow_up_at: day(-1).slice(0, 10) });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.lead.next_follow_up_at.slice(0, 10), day(-1).slice(0, 10));
    const tl = await sales.get(`/admin/leads/${id}/timeline`);
    assert.ok(tl.json.events.some((e: any) => /follow-up set/.test(e.text)));
    const att = await sales.get('/admin/attention');
    assert.ok(att.json.items.some((i: any) => i.key === 'follow_ups'));
    const due = await sales.get('/admin/leads?due=1');
    assert.ok(due.json.leads.some((l: any) => l.id === id));
  });
  test('lead list sorts by priority and company', async () => {
    const r = await sales.get('/admin/leads?sort=company&dir=asc');
    const names = r.json.leads.map((l: any) => l.company ?? '');
    assert.deepEqual(names, [...names].sort((x: string, y: string) => x.localeCompare(y)));
  });
});

describe('notifications and preferences', () => {
  test('unread count drops after marking all as read', async () => {
    await addLead(day(0), { consultation: true });
    const n = await sales.get('/admin/notifications');
    assert.ok(n.json.unread > 0);
    const one = n.json.notifications[0].id;
    await sales.post('/admin/notifications/read', { ids: [one] });
    assert.equal((await sales.get('/admin/notifications')).json.unread, n.json.unread - 1);
    await sales.post('/admin/notifications/read', { all: true });
    assert.equal((await sales.get('/admin/notifications')).json.unread, 0);
  });
  test('notification preferences filter types', async () => {
    await sales.put('/admin/prefs', { prefs: { notif_prefs: { lead: false, consultation: false, enquiry: false, assessment: false, email_failed: false, security: false } } });
    await addLead(day(0), { consultation: true });
    assert.equal((await sales.get('/admin/notifications')).json.notifications.length, 0);
    await sales.put('/admin/prefs', { prefs: { notif_prefs: { lead: true, consultation: true, enquiry: true, assessment: true, email_failed: true, security: true } } });
  });
  test('preferences are validated', async () => {
    assert.equal((await owner.put('/admin/prefs', { prefs: { theme: 'neon' } })).status, 422);
    assert.equal((await owner.put('/admin/prefs', { prefs: { admin: true } })).status, 422);
    assert.equal((await owner.put('/admin/prefs', { prefs: { theme: 'dark', sidebar: 'collapsed' } })).status, 200);
    assert.equal((await owner.get('/admin/prefs')).json.prefs.theme, 'dark');
  });
});

describe('security centre', () => {
  test('owners see all users and sessions; others only their own', async () => {
    const o = await owner.get('/admin/security');
    assert.equal(o.json.scope, 'all');
    assert.ok(o.json.users.length >= 4);
    assert.ok(o.json.sessions.some((s: any) => s.current));
    const v = await viewer.get('/admin/security');
    assert.equal(v.json.scope, 'self'); assert.equal(v.json.users, null);
    assert.ok(v.json.sessions.every((s: any) => s.email === 'viewer@test.nl'));
    assert.ok(o.json.checks.find((c: any) => c.key === 'backups').status === 'unknown', 'unmonitored things are reported as unknown');
  });
  test('a non-owner cannot sign out another user, the owner can', async () => {
    const extra = await login('sales@test.nl', 'Correct-Horse-9!x');
    const sessions = (await owner.get('/admin/security')).json.sessions.filter((s: any) => s.email === 'sales@test.nl');
    assert.ok(sessions.length >= 2);
    const target = sessions[0].id;
    assert.equal((await viewer.del(`/admin/sessions/${target}`)).status, 403);
    assert.equal((await owner.del(`/admin/sessions/${target}`)).status, 200);
    const still = [sales, extra].map(async (c) => (await c.get('/admin/me')).status);
    const codes = await Promise.all(still);
    assert.ok(codes.includes(401), 'the revoked session no longer works');
  });
});

describe('system health', () => {
  test('reports real checks and does not claim unchecked services are healthy', async () => {
    const r = await owner.get('/admin/health');
    assert.equal(r.status, 200);
    const by = Object.fromEntries(r.json.checks.map((c: any) => [c.key, c]));
    assert.equal(by.database.status, 'ok'); assert.equal(by.reports.status, 'ok');
    assert.equal(by.backups.status, 'unknown'); assert.equal(by.scheduling.status, 'not_available');
    assert.ok(!JSON.stringify(r.json).includes('bkpass'), 'no secrets in the response');
  });
});

describe('redirects', () => {
  test('paths are normalised and validated', () => {
    assert.equal(normPath('/Old-Page'), '/old-page/');
    assert.equal(normPath('/file.pdf'), '/file.pdf');
    assert.throws(() => validateRedirect('/api/x', '/y', 301));
    assert.throws(() => validateRedirect('/a', 'javascript:alert(1)', 301));
    assert.throws(() => validateRedirect('/a', '//evil.example', 301));
    assert.throws(() => validateRedirect('/a/', '/a', 301));
  });
  test('created redirects are applied to website requests and loops are refused', async () => {
    const r = await editor.post('/admin/redirects', { from_path: '/old-services', to_path: '/services/', status_code: 301 });
    assert.equal(r.status, 200);
    const res = await fetch(`${base}/old-services/?utm=x`, { redirect: 'manual' });
    assert.equal(res.status, 301); assert.equal(res.headers.get('location'), '/services/?utm=x');
    assert.equal((await editor.post('/admin/redirects', { from_path: '/services/', to_path: '/old-services/' })).status, 422, 'loop refused');
    assert.equal((await viewer.post('/admin/redirects', { from_path: '/x', to_path: '/y' })).status, 403);
    assert.equal((await fetch(`${base}/api/admin/redirects`, { redirect: 'manual' })).status, 401);
  });
});

describe('search matching', () => {
  test('every word must match, in any order', async () => {
    await addLead(day(0), { company: 'Example Energy BV', name: 'Jesse Example' });
    const r = await owner.get('/admin/search?q=energy%20example');
    assert.ok(r.json.results.some((x: any) => x.title === 'Example Energy BV'));
    const none = await owner.get('/admin/search?q=energy%20nonexistentword');
    assert.ok(!none.json.results.some((x: any) => x.group === 'Leads'));
  });
});
