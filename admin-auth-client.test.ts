import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adminApiOrigin, readAdminAuthResponse, isExpiredAdminSession, requestAdminAuth } from './src/lib/adminAuth.ts';

test('only a confirmed unauthorized session response expires the local session', async () => {
  for (const status of [401, 403, 429, 500, 503]) {
    await assert.rejects(
      readAdminAuthResponse(Response.json({ error: 'Service error' }, { status })),
      (error: unknown) => {
        assert.equal(isExpiredAdminSession(error), status === 401);
        return true;
      }
    );
  }
  assert.equal(isExpiredAdminSession(new TypeError('Failed to fetch')), false);
});

test('a proxy HTML response does not expire the local session', async () => {
  await assert.rejects(
    readAdminAuthResponse(new Response('<html>Unavailable</html>', { status: 502 })),
    (error: unknown) => {
      assert.equal(isExpiredAdminSession(error), false);
      return true;
    }
  );
});

test('authentication stays on the dashboard server on local and production hosts', () => {
  for (const hostname of ['localhost', '127.0.0.1', 'admin.mybshoppy.com']) {
    assert.equal(adminApiOrigin(hostname), '');
    assert.equal(adminApiOrigin(hostname, '  '), '');
  }
});

test('an explicit authentication server override is preserved and normalized', () => {
  assert.equal(adminApiOrigin('admin.mybshoppy.com', ' https://auth.example.com/// '), 'https://auth.example.com');
});

test('logout sends credentials and CSRF, and retains the session token when logout fails', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { hostname: 'localhost' } } });
  const calls: RequestInit[] = [];
  let attempts = 0;
  globalThis.fetch = async (_url, init) => {
    calls.push(init || {});
    if (init?.method === 'GET') return Response.json({ user: { id: 'admin' }, csrfToken: 'csrf-value' });
    attempts++;
    return attempts === 1 ? Response.json({ error: 'Denied' }, { status: 403 }) : Response.json({ success: true });
  };
  try {
    await assert.rejects(requestAdminAuth('logout'), /Denied/);
    assert.equal((await requestAdminAuth('logout')).success, true);
    assert.equal(calls.length, 3);
    for (const call of calls.slice(1)) {
      assert.equal(call.credentials, 'include');
      assert.equal(call.method, 'POST');
      assert.equal((call.headers as Record<string, string>)['x-csrf-token'], 'csrf-value');
    }
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
  }
});

test('logout does not accept a success response without confirmation', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { hostname: 'localhost' } } });
  globalThis.fetch = async (_url, init) => init?.method === 'GET' ? Response.json({ csrfToken: 'csrf-value' }) : Response.json({});
  try { await assert.rejects(requestAdminAuth('logout'), /Unable to sign out/); }
  finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
  }
});
