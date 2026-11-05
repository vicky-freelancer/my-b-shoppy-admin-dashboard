import { readFile } from 'node:fs/promises';
import path from 'node:path';

const API_BASE = (process.env.MBS_API_BASE || 'https://api.mybshoppy.com').replace(/\/+$/, '');
const ADMIN_ORIGIN = process.env.MBS_ADMIN_ORIGIN || 'https://admin.mybshoppy.com';
const LOGIN = process.env.MBS_ADMIN_USER;
const PASSWORD = process.env.MBS_ADMIN_PASSWORD;
const OLD_ID = process.env.MBS_OLD_CATEGORY_ID || 'senthil';
const NEW_ID = process.env.MBS_NEW_CATEGORY_ID || 'flash-deals';
const NEW_NAME = process.env.MBS_NEW_CATEGORY_NAME || 'Flash Deals';
const IMAGE = process.env.MBS_CATEGORY_IMAGE
  || path.resolve('D:/my B shoppy frontend/frontend/public/images/categories/FlashDeals.jpg');

if (!LOGIN || !PASSWORD) {
  console.error('Set MBS_ADMIN_USER and MBS_ADMIN_PASSWORD before running.');
  process.exit(2);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function cookieFrom(response) {
  const raw = (response.headers.getSetCookie?.() || []).map((value) => value.split(';')[0]).join('; ');
  if (!raw) fail('Login did not return a session cookie.');
  return raw;
}

async function request(pathname, { method = 'GET', cookie = '', csrf = '', body, headers = {} } = {}) {
  const response = await fetch(API_BASE + pathname, {
    method,
    headers: {
      Origin: ADMIN_ORIGIN,
      ...(cookie ? { Cookie: cookie } : {}),
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
      ...headers,
    },
    body,
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  return { response, data };
}

async function uploadImage(cookie, csrf) {
  const bytes = await readFile(IMAGE);
  const form = new FormData();
  form.append('image', new Blob([bytes], { type: 'image/jpeg' }), path.basename(IMAGE));
  const uploaded = await request('/api/v1/admin/media', { method: 'POST', cookie, csrf, body: form });
  if (!uploaded.response.ok) fail(`Image upload failed (${uploaded.response.status}): ${uploaded.data?.error || uploaded.data?.code || 'unknown'}`);
  const assetId = uploaded.data?.asset?.id;
  if (!assetId) fail('Image upload succeeded but returned no asset id.');
  console.log(`Uploaded image asset ${assetId}.`);
  return String(assetId);
}

const login = await request('/api/v1/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: LOGIN, password: PASSWORD }),
});
if (!login.response.ok) fail(`Login failed (${login.response.status}): ${login.data?.error || login.data?.code || 'unknown'}`);
const cookie = cookieFrom(login.response);
const csrf = login.data?.csrfToken;
if (!csrf) fail('Login did not return a CSRF token.');

const listed = await request('/api/v1/admin/categories', { cookie });
if (!listed.response.ok) fail(`Could not read categories (${listed.response.status}).`);
const categories = listed.data?.categories;
if (!Array.isArray(categories)) fail('Category response was not a list.');

const oldCategory = categories.find((category) => String(category.id) === OLD_ID);
if (!oldCategory) fail(`Old category "${OLD_ID}" was not found.`);
const highest = categories.reduce((max, category) => Math.max(max, Number(category.sort_order) || 0), 0);
const sortOrder = highest + 1;

let newCategory = categories.find((category) => String(category.id) === NEW_ID);
if (newCategory) {
  console.log(`Category "${NEW_ID}" already exists; updating it.`);
} else {
  const created = await request('/api/v1/admin/categories', {
    method: 'POST',
    cookie,
    csrf,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: NEW_NAME, slug: NEW_ID, sort_order: sortOrder }),
  });
  if (!created.response.ok) fail(`Category creation failed (${created.response.status}): ${created.data?.error || created.data?.code || 'unknown'}`);
  newCategory = created.data?.category;
  console.log(`Created category "${NEW_ID}".`);
}

let imageAssetId = oldCategory.image_asset_id ? String(oldCategory.image_asset_id) : null;
if (!imageAssetId) imageAssetId = await uploadImage(cookie, csrf);

const updatedNew = await request(`/api/v1/admin/categories/${encodeURIComponent(NEW_ID)}`, {
  method: 'PATCH',
  cookie,
  csrf,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: NEW_NAME,
    sort_order: sortOrder,
    image_asset_id: imageAssetId,
    is_active: true,
  }),
});
if (!updatedNew.response.ok) fail(`Updating "${NEW_ID}" failed (${updatedNew.response.status}): ${updatedNew.data?.error || updatedNew.data?.code || 'unknown'}`);
console.log(`Active category: ${NEW_ID} (${NEW_NAME}, sort_order=${updatedNew.data?.category?.sort_order}).`);

if (OLD_ID !== NEW_ID) {
  const retired = await request(`/api/v1/admin/categories/${encodeURIComponent(OLD_ID)}`, {
    method: 'PATCH',
    cookie,
    csrf,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'SENTHIL', is_active: false }),
  });
  if (!retired.response.ok) fail(`Retiring "${OLD_ID}" failed (${retired.response.status}): ${retired.data?.error || retired.data?.code || 'unknown'}`);
  console.log(`Deactivated legacy category ${OLD_ID}.`);
}

const verified = await request('/api/v1/categories');
if (!verified.response.ok) fail(`Could not verify the public catalog (${verified.response.status}).`);
const publicCategories = verified.data?.categories || [];
const entry = publicCategories.find((category) => category.id === NEW_ID);
if (!entry) fail('The new category is not visible in the public catalog.');
if (publicCategories.some((category) => category.id === OLD_ID)) fail('The old category is still visible in the public catalog.');
const isLast = publicCategories[publicCategories.length - 1]?.id === NEW_ID;
console.log(`Public URL: /categories/${NEW_ID} | position ${publicCategories.findIndex((c) => c.id === NEW_ID) + 1} of ${publicCategories.length} (last=${isLast}).`);
console.log('Done. The storefront reads this live catalog, so the new URL is reflected immediately.');
