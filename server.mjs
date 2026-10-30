import 'dotenv/config';
import express from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '4kb' }));
const username = process.env.ADMIN_USERNAME || 'myBadmin';
// scrypt salt and digest only. The password is never sent to the client bundle.
const passwordHash = process.env.ADMIN_PASSWORD_HASH || '8f2e6482dd38ed3ad183a604f8418dce:1ea7265916a26f31f70036fc09785c4ebb28db5c3ee5a96cb1e638e5eecf0964dd71e56212587bee8dc56e6528719168ecdb7a127d6379b62835466a43cae69c';
const [salt, digest] = passwordHash.split(':');
if (!salt || !/^[a-f0-9]{128}$/i.test(digest || '')) throw new Error('ADMIN_PASSWORD_HASH must contain a salt and a 64-byte hex scrypt digest.');
const expected = Buffer.from(digest, 'hex');
const sessions = new Map();
const attempts = new Map();
const lifetime = 8 * 60 * 60 * 1000;
const user = { id: 'myb-admin', name: username, email: '', role: 'Super Admin' };
const cookieName = process.env.NODE_ENV === 'production' ? '__Host-myb_admin' : 'myb_admin';
const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
const readToken = (req) => req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
const clearCookie = (res) => res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`);
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [token, expires] of sessions) if (expires <= now) sessions.delete(token);
  for (const [ip, attempt] of attempts) if (attempt.expires <= now) attempts.delete(ip);
}, 60_000);
cleanup.unref();
app.use('/api/admin', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'POST' && req.headers.origin) {
    try { if (new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({ error: 'Request origin is not allowed.' }); }
    catch { return res.status(403).json({ error: 'Invalid request origin.' }); }
  }
  next();
});
app.get('/api/admin/session', (req, res) => {
  const token = readToken(req);
  if (!token || (sessions.get(token) || 0) <= Date.now()) {
    if (token) sessions.delete(token);
    clearCookie(res);
    return res.status(401).json({ error: 'Please sign in.' });
  }
  res.json({ user });
});
app.post('/api/admin/login', (req, res) => {
  const key = req.ip;
  const now = Date.now();
  let attempt = attempts.get(key);
  if (!attempt || attempt.expires <= now) attempt = { count: 0, expires: now + 15 * 60 * 1000 };
  if (attempt.count >= 5) {
    res.setHeader('Retry-After', String(Math.ceil((attempt.expires - now) / 1000)));
    return res.status(429).json({ error: 'Too many attempts. Please try again in 15 minutes.' });
  }
  const { userId, password } = req.body || {};
  if (typeof userId !== 'string' || typeof password !== 'string' || userId.length > 100 || password.length > 256) return res.status(400).json({ error: 'Enter a valid user ID and password.' });
  const actual = scryptSync(password, salt, 64);
  const validPassword = timingSafeEqual(actual, expected);
  if (userId !== username || !validPassword) {
    attempt.count += 1;
    attempts.set(key, attempt);
    return res.status(401).json({ error: 'Incorrect user ID or password.' });
  }
  attempts.delete(key);
  const oldToken = readToken(req);
  if (oldToken) sessions.delete(oldToken);
  const token = randomBytes(32).toString('hex');
  sessions.set(token, now + lifetime);
  res.setHeader('Set-Cookie', `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${lifetime / 1000}${secure}`);
  res.json({ user });
});
app.post('/api/admin/logout', (req, res) => {
  sessions.delete(readToken(req));
  clearCookie(res);
  res.json({ success: true });
});
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
if (process.argv.includes('--dev')) {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(root, 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(root, 'dist/index.html')));
}
const portFlagIndex = process.argv.indexOf('--port');
const portArg = process.argv.find((value) => value.startsWith('--port='))?.split('=')[1] || (portFlagIndex >= 0 ? process.argv[portFlagIndex + 1] : undefined);
const port = Number(process.env.PORT || portArg || 3000);
app.listen(port, process.env.HOST || '0.0.0.0', () => console.log(`Admin server running at http://localhost:${port}`));
