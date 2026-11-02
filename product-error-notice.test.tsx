import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProductErrorNotice } from './src/components/ProductErrorNotice.tsx';

test('MariaDB product errors show the API message without Supabase recovery', () => {
  const html = renderToStaticMarkup(<ProductErrorNotice error="Product SKU already exists" mariaDbMode={true} onOpenSqlSetup={() => {}} />);
  assert.match(html, /role="alert"/);
  assert.match(html, /Could not save product/);
  assert.match(html, /Product SKU already exists/);
  assert.doesNotMatch(html, /Database Storage Notice|Fix Supabase Table/);
});

test('Supabase product errors retain the table setup action', () => {
  const html = renderToStaticMarkup(<ProductErrorNotice error="Table unavailable" mariaDbMode={false} onOpenSqlSetup={() => {}} />);
  assert.match(html, /Table unavailable/);
  assert.match(html, /Database Storage Notice/);
  assert.match(html, /Fix Supabase Table/);
});
