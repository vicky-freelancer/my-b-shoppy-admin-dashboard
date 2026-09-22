import React, { useState, useRef, useEffect } from 'react';
import { AdminUser, AppSettings } from '../types';
import {
  PackageCheck,
  Settings,
  Plus,
  RefreshCw,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Database
} from 'lucide-react';

interface NavbarProps {
  settings: AppSettings;
  adminUser: AdminUser | null;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenNewOrder: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
  supabaseConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  adminUser,
  onLogout,
  onOpenSettings,
  onOpenNewOrder,
  onRefresh,
  isLoading = false,
  supabaseConnected = true,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand / App Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-200 shrink-0 font-bold">
            <PackageCheck className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-800 tracking-tight truncate">
                {settings.appName || 'COD Admin Dashboard'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                COD Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate hidden md:block">
              {settings.companyName || 'Cash-on-Delivery Order Operations'}
            </p>
          </div>
        </div>

        {/* Center: Live Supabase Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-medium text-slate-600">
            Supabase DB: <strong className="text-slate-800">orders</strong>
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Refresh button */}
          <button
            type="button"
            id="navbar-refresh-btn"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh orders from Supabase"
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* New COD order button */}
          <button
            type="button"
            id="navbar-new-order-btn"
            onClick={onOpenNewOrder}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 flex items-center gap-1.5 transition-all shadow-sm shadow-blue-200 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Order</span>
          </button>

          {/* Settings button */}
          <button
            type="button"
            id="navbar-settings-btn"
            onClick={onOpenSettings}
            title="Dashboard Settings & Branding"
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Dropdown */}
          {adminUser && (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                id="navbar-profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center font-bold text-xs uppercase">
                  {adminUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <div className="font-semibold text-slate-900 leading-tight">{adminUser.name}</div>
                  <div className="text-[10px] text-slate-500">{adminUser.role}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="font-semibold text-slate-900">{adminUser.name}</p>
                    <p className="text-slate-500 text-[11px] truncate">{adminUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                      {adminUser.role}
                    </span>
                  </div>

                  <div className="p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full px-3 py-2 text-left rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Settings & App Name</span>
                    </button>

                    <button
                      type="button"
                      id="navbar-logout-btn"
                      onClick={() => {
                        setProfileOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3 py-2 text-left rounded-lg text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
