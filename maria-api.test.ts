import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mariaSaveProduct, mariaSaveSubcategory } from './src/lib/mariaApi.ts';

test('catalog saves upload images and send only catalog fields for creates and edits', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { hostname: 'localhost' } } });
  const requests: { url: string; method: string; body: any }[] = [];
  globalThis.fetch = async (url, options: RequestInit = {}) => {
    const address = String(url);
    if (address.startsWith('data:')) return new Response(new Blob(['image'], { type: 'image/png' }));
    const body = options.body instanceof FormData ? options.body : options.body ? JSON.parse(String(options.body)) : undefined;
    requests.push({ url: address, method: options.method || 'GET', body });
    if (address.endsWith('/api/admin/session')) return Response.json({ csrfToken: 'token' });
    if (address.endsWith('/media')) return Response.json({ asset: { id: 42 } });
    if (address.includes('/products?pageSize=')) return Response.json({ count: 1, products: [{ id: 7, title: 'Old', sku: 'SKU', category_id: 'rings', subcategory_id: 3, cover_image: '/media/old', image_asset_id: 12, sale_price: 80, mrp: 100, quantity: 5, variants: ['Gold'], row_version: 2, image_url: 'data:image/png;base64,old', created_at: 'yesterday' }] });
    if (address.includes('/products')) return Response.json({ product: { cover_image: '/media/new' } });
    if (address.includes('/subcategories')) return Response.json({ subcategory: { featured_image: '/media/new' } });
    throw new Error(`Unexpected request: ${address}`);
  };
  try {
    const image = 'data:image/png;base64,' + 'a'.repeat(150_000);
    const product = { title: 'Ring', sku: 'R1', category: 'Rings', category_id: 'rings', subcategory_id: 3, cover_image: image, image_url: image, file: new Blob(['image']), mrp: 120, sale_price: 90, quantity: 4, variants: ['Gold', 'Silver'], badges: ['New'] };
    assert.equal((await mariaSaveProduct(product)).success, true);
    assert.equal((await mariaSaveProduct({ title: 'Updated', cover_image: image }, 7)).success, true);
    const subcategory = { category_id: 'rings', name: 'Bands', featured_image: image, image_url: image, file: new Blob(['image']), is_active: true, sort_order: 2 };
    assert.equal((await mariaSaveSubcategory(subcategory)).success, true);
    assert.equal((await mariaSaveSubcategory({ ...subcategory, row_version: 3, id: 9 }, 9)).success, true);

    const saves = requests.filter(r => (r.method === 'POST' || r.method === 'PATCH') && /\/(products|subcategories)(\/\d+)?$/.test(r.url));
    assert.equal(saves.length, 4);
    assert.deepEqual(saves[0].body, { title: 'Ring', sku: 'R1', category: 'Rings', category_id: 'rings', subcategory_id: 3, image_asset_id: 42, mrp: 120, sale_price: 90, quantity: 4, badges: ['New'], variants: ['Gold', 'Silver'] });
    assert.deepEqual(saves[1].body, { row_version: 2, title: 'Updated', sku: 'SKU', category_id: 'rings', subcategory_id: 3, image_asset_id: 42, mrp: 100, sale_price: 80, quantity: 5, variants: ['Gold'] });
    assert.deepEqual(saves[2].body, { category_id: 'rings', name: 'Bands', featured_asset_id: 42, is_active: true, sort_order: 2 });
    assert.deepEqual(saves[3].body, { row_version: 3, category_id: 'rings', name: 'Bands', featured_asset_id: 42, is_active: true, sort_order: 2 });
    assert.equal(requests.filter(r => r.url.endsWith('/media') && r.body instanceof FormData).length, 4);
    for (const save of saves) assert.ok(JSON.stringify(save.body).length < 1024);
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
  }
});

test('catalog save errors preserve API messages and codes', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { hostname: 'localhost' } } });
  globalThis.fetch = async (url) => {
    const address = String(url);
    if (address.startsWith('data:')) return new Response(new Blob(['image'], { type: 'image/png' }));
    if (address.endsWith('/api/admin/session')) return Response.json({ csrfToken: 'token' });
    if (address.endsWith('/media')) return Response.json({ asset: { id: 42 } });
    if (address.endsWith('/products')) return Response.json({ code: 'DUPLICATE_SKU', message: 'Product SKU already exists' }, { status: 409 });
    if (address.endsWith('/subcategories')) return Response.json({ code: 'CATEGORY_NOT_FOUND' }, { status: 400 });
    throw new Error(`Unexpected request: ${address}`);
  };
  try {
    const image = 'data:image/png;base64,YQ==';
    assert.equal((await mariaSaveProduct({ title: 'Ring', cover_image: image })).error, 'Product SKU already exists');
    assert.equal((await mariaSaveSubcategory({ category_id: 'rings', name: 'Bands', featured_image: image })).error, 'CATEGORY_NOT_FOUND');
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
  }
});
