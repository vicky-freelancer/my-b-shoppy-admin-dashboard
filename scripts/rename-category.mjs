import { readFile } from 'node:fs/promises';
import path from 'node:path';

const API_BASE = (process.env.MBS_API_BASE || 'https://api.mybshoppy.com').replace(/\/+$/, '');
const ADMIN_ORIGIN = process.env.MBS_ADMIN_ORIGIN || 'https://admin.mybshoppy.com';
const LOGIN = process.env.MBS_ADMIN_USER;
const PASSWORD = process.env.MBS_ADMIN_PASSWORD;
const MATCH = (process.env.MBS_CATEGORY_MATCH || 'SENTHIL').trim().toLowerCase();
const NEW_NAME = (process.env.MBS_NEW_CATEGORY_NAME || 'Flash Deals').trim();
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
  const cookies = response.headers.getSetCookie?.() || [];
  const raw = cookies.map((value) => value.split(';')[0]).join('; ');
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

const target = categories.find((category) =>
  String(category.name || '').trim().toLowerCase() === MATCH ||
  String(category.id || '').toLowerCase() === MATCH ||
  String(category.slug || '').toLowerCase() === MATCH
);
if (!target) fail(`No category matching "${MATCH}" was found in the live catalog.`);

const highest = categories.reduce((max, category) => Math.max(max, Number(category.sort_order) || 0), 0);
const sortOrder = highest + 1;

console.log(`Found "${target.name}" (id=${target.id}, sort_order=${target.sort_order}).`);
console.log(`Uploading ${IMAGE} ...`);
let imageAssetId;
try {
  const bytes = await readFile(IMAGE);
  const form = new FormData();
  form.append('image', new Blob([bytes], { type: 'image/jpeg' }), path.basename(IMAGE));
  const uploaded = await request('/api/v1/admin/media', { method: 'POST', cookie, csrf, body: form });
  if (!uploaded.response.ok) fail(`Image upload failed (${uploaded.response.status}): ${uploaded.data?.error || uploaded.data?.code || 'unknown'}`);
  imageAssetId = uploaded.data?.asset?.id;
  if (!imageAssetId) fail('Image upload succeeded but returned no asset id.');
  console.log(`Uploaded image asset ${imageAssetId}.`);
} catch (error) {
  fail(`Could not read or upload image: ${error.message}`);
}

const updated = await request(`/api/v1/admin/categories/${encodeURIComponent(target.id)}`, {
  method: 'PATCH',
  cookie,
  csrf,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: NEW_NAME,
    sort_order: sortOrder,
    image_asset_id: String(imageAssetId),
    is_active: true,
  }),
});
if (!updated.response.ok) fail(`Rename failed (${updated.response.status}): ${updated.data?.error || updated.data?.code || 'unknown'}`);
console.log(`Updated category: name="${updated.data?.category?.name}", sort_order=${updated.data?.category?.sort_order}.`);

const verified = await request('/api/v1/categories');
if (!verified.response.ok) fail(`Could not verify the public catalog (${verified.response.status}).`);
const publicCategories = verified.data?.categories || [];
const renamed = publicCategories.find((category) => category.id === target.id);
if (!renamed) fail('The category is not visible in the public catalog after the update.');
const isLast = publicCategories[publicCategories.length - 1]?.id === target.id;
console.log(`Public catalog now lists "${renamed.name}" at position ${publicCategories.findIndex((c) => c.id === target.id) + 1} of ${publicCategories.length} (last=${isLast}).`);
if (!isLast) fail('The category is not the last active category; check for other categories with an equal or higher sort_order.');
console.log('Done. The storefront reads this live catalog, so the change is reflected immediately.');
