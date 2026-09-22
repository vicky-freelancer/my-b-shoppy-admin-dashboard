import React, { useState } from 'react';
import { AdminUser, AppSettings } from '../types';
import {
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
    <header className="h-16 bg-[#0c0a09] border-b border-[#241e17] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Brand / Admin Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="text-xs font-serif uppercase tracking-[0.2em] text-[#e5c158] font-bold">
          MY B SHOPPY ADMIN
        </h1>
      </div>

      {/* Center Search Input */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8c7a4f] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="topheader-search-input"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-full bg-[#16120d] border border-[#2d251a] text-[#f3e7c4] placeholder:text-[#736342] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 transition-all"
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => onGlobalSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c7a4f] hover:text-[#e5c158]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* SQL Schema Button */}
        {onOpenSqlSetup && (
          <button
            type="button"
            id="topheader-sql-setup-btn"
            onClick={onOpenSqlSetup}
            title="Supabase Unified SQL Schema Editor"
            className="px-2.5 py-1.5 rounded-lg bg-[#1a140d] border border-[#382d20] text-[#e5c158] hover:bg-[#251d13] transition-colors flex items-center gap-1.5 text-xs font-medium"
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
          className="p-2 rounded-lg text-[#8c7a4f] hover:text-[#e5c158] hover:bg-[#16120e] transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#e5c158]' : ''}`} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            id="topheader-notifications-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-[#8c7a4f] hover:text-[#e5c158] hover:bg-[#16120e] transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#e5c158]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#14100c] border border-[#2d251a] shadow-xl p-3 z-50 text-xs text-[#d8cca8] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#241e17]">
                <span className="font-bold text-[#e5c158]">Notifications</span>
                <span className="text-[10px] text-[#8c7a4f]">2 New Alerts</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-[#1c1813] border border-[#2d251a]">
                  <p className="font-medium text-[#f3e7c4]">Stock Alert</p>
                  <p className="text-[11px] text-[#9b8d6f] mt-0.5">
                    Royal Kundan Choker has only 8 units left in stock.
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-[#1c1813] border border-[#2d251a]">
                  <p className="font-medium text-[#f3e7c4]">New COD Order</p>
                  <p className="text-[11px] text-[#9b8d6f] mt-0.5">
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
          className="p-2 rounded-lg text-[#8c7a4f] hover:text-[#e5c158] hover:bg-[#16120e] transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Fullscreen / Dismiss */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 rounded-lg text-[#8c7a4f] hover:text-[#e5c158] hover:bg-[#16120e] transition-colors hidden sm:block"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
