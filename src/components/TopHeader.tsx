import React, { useState } from 'react';
import { AdminUser, AppSettings } from '../types';
import {
  Menu,
  Search,
  Bell,
  Settings,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Plus,
  Gem,
  ShoppingBag,
  Database
} from 'lucide-react';

interface TopHeaderProps {
  onOpenMenu: () => void;
  settings: AppSettings;
  adminUser: AdminUser | null;
  onOpenSettings: () => void;
  onOpenNewProduct: () => void;
  onOpenNewOrder: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
  globalSearch: string;
  onGlobalSearchChange: (value: string) => void;
  onOpenSqlSetup?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMenu,
  settings,
  adminUser,
  onOpenSettings,
  onOpenNewProduct,
  onOpenNewOrder,
  onRefresh,
  isLoading = false,
  globalSearch,
  onGlobalSearchChange,
  onOpenSqlSetup,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <header className="min-h-16 py-2 sm:py-0 bg-[#ffffff] border-b border-black shadow-sm shadow-slate-200/60 px-4 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-20">
      {/* Brand / Admin Breadcrumb */}
      <div className="flex items-center gap-1 sm:gap-3 min-w-0">
        <button id="admin-menu-button" type="button" onClick={onOpenMenu} aria-label="Open navigation" aria-controls="admin-sidebar" className="lg:hidden p-2.5 rounded-lg text-slate-700"><Menu className="w-5 h-5" /></button>
        <h1 className="px-2 sm:px-3 py-1.5 rounded-lg bg-[#f8fafc] border border-black text-[10px] sm:text-xs font-serif uppercase tracking-[0.06em] sm:tracking-[0.2em] text-[#a16207] font-bold">
          MY B SHOPPY ADMIN
        </h1>
      </div>

      {/* Center Search Input */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="topheader-search-input"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-full bg-[#f8fafc] border border-black text-[#0f172a] placeholder:text-[#64748b] focus:bg-[#ffffff] focus:outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706]/30 transition-all"
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => onGlobalSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#a16207]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-3">
        {/* SQL Schema Button */}
        {onOpenSqlSetup && (
          <button
            type="button"
            id="topheader-sql-setup-btn"
            onClick={onOpenSqlSetup}
            title="Supabase Unified SQL Schema Editor"
            className="hidden sm:flex px-2.5 py-1.5 rounded-lg bg-[#f8fafc] border border-black text-[#a16207] hover:bg-[#e2e8f0] transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">SQL Schema</span>
          </button>
        )}

        {/* Refresh Sync button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh Data"
          className="p-2 rounded-lg text-[#475569] hover:text-[#a16207] hover:bg-[#f1f5f9] transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#a16207]' : ''}`} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            id="topheader-notifications-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-[#475569] hover:text-[#a16207] hover:bg-[#f1f5f9] transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#a16207]" />
          </button>

          {notificationsOpen && (
            <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-16 sm:top-auto sm:right-0 mt-2 sm:w-72 max-w-[calc(100vw-1.5rem)] rounded-xl bg-[#f8fafc] border border-black shadow-xl p-3 z-50 text-xs text-[#334155] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-black">
                <span className="font-bold text-[#a16207]">Notifications</span>
                <span className="text-[10px] text-[#475569]">2 New Alerts</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-[#f8fafc] border border-black">
                  <p className="font-medium text-[#0f172a]">Stock Alert</p>
                  <p className="text-[11px] text-[#475569] mt-0.5">
                    Royal Kundan Choker has only 8 units left in stock.
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-[#f8fafc] border border-black">
                  <p className="font-medium text-[#0f172a]">New COD Order</p>
                  <p className="text-[11px] text-[#475569] mt-0.5">
                    Order #ORD-1001 for Pearl Petal Bloom received.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          type="button"
          id="topheader-settings-btn"
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-[#475569] hover:text-[#a16207] hover:bg-[#f1f5f9] transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Fullscreen / Dismiss */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 rounded-lg text-[#475569] hover:text-[#a16207] hover:bg-[#f1f5f9] transition-colors hidden sm:block"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
