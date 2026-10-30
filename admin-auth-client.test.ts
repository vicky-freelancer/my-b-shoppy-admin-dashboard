import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adminApiOrigin } from './src/lib/adminAuth.ts';

test('authentication stays on the dashboard server on local and production hosts', () => {
  for (const hostname of ['localhost', '127.0.0.1', 'admin.mybshoppy.com']) {
    assert.equal(adminApiOrigin(hostname), '');
    assert.equal(adminApiOrigin(hostname, '  '), '');
  }
});

test('an explicit authentication server override is preserved and normalized', () => {
  assert.equal(adminApiOrigin('admin.mybshoppy.com', ' https://auth.example.com/// '), 'https://auth.example.com');
});
