import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, createUser, login, Client, db } from './helpers';

before(async () => { await start(); });
after(stop);

test('password alone never signs in: a second step is required', async () => {
  const u = await createUser('a@test.nl', 'admin');
  const c = new Client();
  const r = await c.post('/admin/login', { email: u.email, password: u.password });
  assert.equal(r.status, 200); assert.equal(r.json.mfa, 'setup'); assert.equal(r.json.user, undefined);
  assert.equal((await c.get('/admin/me')).status, 401);
});

test('wrong passwords are refused and counted', async () => {
  const u = await createUser('b@test.nl', 'admin');
  const c = new Client();
  assert.equal((await c.post('/admin/login', { email: u.email, password: 'wrong-password-123' })).status, 401);
  assert.equal(Number(await db.val('SELECT failed_logins FROM users WHERE email = ?', [u.email])), 1);
});

test('role capabilities are enforced on the server', async () => {
  const s = await createUser('s@test.nl', 'sales'); const e = await createUser('e@test.nl', 'editor');
  const sales = await login(s.email, s.password); const editor = await login(e.email, e.password);
  assert.equal((await sales.get('/admin/settings')).status, 403);
  assert.equal((await sales.get('/admin/leads')).status, 200);
  assert.equal((await editor.get('/admin/leads')).status, 403);
  assert.equal((await editor.get('/admin/users')).status, 403);
  assert.ok(Number(await db.val("SELECT COUNT(*) FROM audit_log WHERE action = 'auth.denied'")) >= 3, 'denied requests are audited');
});

test('signing out ends the session', async () => {
  const u = await createUser('c@test.nl', 'viewer');
  const c = await login(u.email, u.password);
  assert.equal((await c.get('/admin/me')).status, 200);
  await c.post('/admin/logout');
  assert.equal((await c.get('/admin/me')).status, 401);
});

test('roles endpoint exposes the permission matrix used by the UI', async () => {
  const u = await createUser('d@test.nl', 'viewer');
  const c = await login(u.email, u.password);
  const r = await c.get('/admin/roles');
  assert.deepEqual(r.json.caps.users, ['owner']);
});
