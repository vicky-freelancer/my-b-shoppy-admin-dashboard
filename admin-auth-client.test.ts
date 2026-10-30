import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adminApiOrigin, readAdminAuthResponse, isExpiredAdminSession } from './src/lib/adminAuth.ts';

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
