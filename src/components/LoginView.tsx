import React, { useState } from 'react';
import { AdminUser, AppSettings } from '../types';
import { PackageCheck, Lock, User, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: AdminUser) => void;
  settings: AppSettings;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, settings }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim(), password }),
      });
      const result = await response.json();
      if (!response.ok || !result.user) throw new Error(result.error || 'Unable to sign in. Please try again.');
      setPassword('');
      onLoginSuccess(result.user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
    } finally { setIsLoading(false); }
  };
  return (
    <main className="min-h-dvh bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#a16207] text-white mb-3"><PackageCheck className="w-6 h-6" /></div>
          <h1 className="text-2xl font-bold text-slate-900">{settings.appName || 'MY B SHOPPY'}</h1>
          <p className="text-sm text-slate-600 mt-2">Sign in to manage your store</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          {errorMessage && <p role="alert" className="p-3 bg-rose-50 text-rose-700 rounded-lg text-sm">{errorMessage}</p>}
          <div>
            <label htmlFor="admin-user-id" className="block text-sm text-slate-700 mb-2">User ID</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input id="admin-user-id" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={userId} onChange={(event) => setUserId(event.target.value)} className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-3 text-base" />
            </div>
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm text-slate-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input id="admin-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-3 text-base" />
            </div>
          </div>
          <button id="submit-auth-btn" type="submit" disabled={isLoading} className="min-h-11 w-full rounded-lg bg-[#a16207] hover:bg-[#854d0e] text-white px-4 py-3 flex items-center justify-center gap-2 disabled:opacity-60">
            {isLoading ? 'Signing in...' : 'Sign In'}<ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </main>
  );
};
