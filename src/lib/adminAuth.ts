import type { AdminUser } from '../types';

export function adminApiOrigin(hostname: string, configuredOrigin = ''): string {
  const configured = configuredOrigin.trim().replace(/\/+$/, '');
  if (configured) return configured;
  return hostname === 'admin.mybshoppy.com' ? 'https://api.mybshoppy.com' : '';
}

export async function readAdminAuthResponse(response: Response): Promise<{ user?: AdminUser; success?: boolean }> {
  const unavailable = 'The sign-in service is unavailable. Please try again shortly.';
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) throw new Error(unavailable);
  let result: { user?: AdminUser; success?: boolean; error?: string };
  try { result = await response.json(); }
  catch { throw new Error(unavailable); }
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error(unavailable);
  if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : unavailable);
  return result;
}

export async function requestAdminAuth(action: 'login' | 'session' | 'logout', body?: { userId: string; password: string }) {
  const origin = adminApiOrigin(window.location.hostname, import.meta.env?.VITE_ADMIN_API_URL);
  let response: Response;
  try {
    response = await fetch(`${origin}/api/admin/${action}`, {
      method: action === 'session' ? 'GET' : 'POST',
      credentials: 'include', cache: 'no-store',
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    });
  } catch { throw new Error('Cannot reach the sign-in service. Check your connection and try again.'); }
  return readAdminAuthResponse(response);
}
