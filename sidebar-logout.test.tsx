import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar } from './src/components/Sidebar.tsx';

test('authenticated navigation exposes logout in expanded and collapsed views', () => {
  for (const isCollapsed of [false, true]) {
    const html = renderToStaticMarkup(<Sidebar activeTab="dashboard" onSelectTab={() => {}} adminUser={null} onOpenSettings={() => {}} onLogout={() => {}} isCollapsed={isCollapsed} />);
    assert.match(html, /aria-label="Logout"/);
    if (!isCollapsed) assert.match(html, />Logout<\/span>/);
  }
});
