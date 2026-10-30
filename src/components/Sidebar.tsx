import React from 'react';
import { NavTab, AdminUser } from '../types';
import {
  LayoutDashboard,
  Gem,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Layers,
  X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  adminUser: AdminUser | null;
  onOpenSettings: () => void;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  ordersCount?: number;
  productsCount?: number;
  subcategoriesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onMobileClose,
  activeTab,
  onSelectTab,
  adminUser,
  onOpenSettings,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
  ordersCount = 0,
  productsCount = 0,
  subcategoriesCount = 0,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'subcategories',
      label: 'Subcategories',
      icon: Layers,
      badge: subcategoriesCount,
    },
    {
      id: 'products',
      label: 'Products',
      icon: Gem,
      badge: productsCount,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: ordersCount,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
    },
  ];

  return (
    <aside
      id="admin-sidebar"
      aria-label="Admin navigation"
      role={mobileOpen ? 'dialog' : undefined}
      aria-modal={mobileOpen || undefined}
      className={`${mobileOpen ? 'flex' : 'hidden'} lg:flex fixed lg:sticky left-0 top-0 h-dvh overflow-y-auto max-w-[85vw] bg-[#ffffff] border-r border-black flex-col justify-between shrink-0 z-50 lg:z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <button type="button" onClick={onMobileClose} aria-label="Close navigation" className="lg:hidden self-end m-2 p-3 rounded-lg text-slate-700"><X className="w-5 h-5" /></button>
      {/* Top Brand Header */}
      <div>
        <div className="px-5 py-4 bg-[#f8fafc] border-b border-black flex items-center justify-between">
          {!isCollapsed ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-black tracking-widest text-[#a16207] uppercase">
                  MY B SHOPPY
                </span>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#475569] mt-0.5">
                MANAGEMENT
              </p>
            </div>
          ) : (
            <div className="mx-auto w-10 h-10 rounded-xl bg-[#f8fafc] border border-[#d97706]/40 flex items-center justify-center text-[#a16207] font-serif font-bold text-base shadow-sm shadow-[#d97706]/10">
              B
            </div>
          )}

          {onToggleCollapse && !isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:block p-1 rounded-lg text-[#475569] hover:text-[#a16207] hover:bg-[#f1f5f9] transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className="mx-4 mt-4 mb-2 px-2.5 py-1.5 rounded-lg bg-[#f8fafc] border border-black text-[9px] font-bold uppercase tracking-[0.2em] text-[#64748b]">
            Navigation
          </div>
        )}

        {/* Navigation Links */}
        <nav className={`px-3 pb-4 space-y-1.5 ${isCollapsed ? 'mt-4' : ''}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                id={`sidebar-nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-[#fffbeb] text-[#a16207] border border-[#d97706]/50 shadow-sm font-semibold'
                    : 'text-[#475569] hover:text-[#0f172a] hover:bg-[#f8fafc] border border-transparent'
                }`}
                title={item.label}
              >
                <div
                  className={`flex items-center justify-center ${
                    isActive ? 'text-[#a16207]' : 'text-[#475569] group-hover:text-[#a16207]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {!isCollapsed && (
                  <span className="flex-1 text-left tracking-wide truncate">
                    {item.label}
                  </span>
                )}

                {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-[#a16207] text-[#ffffff]'
                        : 'bg-[#e2e8f0] text-[#475569] border border-black'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Quick Settings */}
      <div className="p-3 border-t border-black bg-[#f8fafc] space-y-2">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-[#ffffff] border border-black shadow-sm ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition-opacity"
            title="Open Settings"
          >
            <div className="w-8 h-8 rounded-lg bg-[#fffbeb] border border-[#d97706]/40 flex items-center justify-center text-[#a16207] shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0f172a] leading-tight truncate">
                  {adminUser?.name || 'Admin'}
                </p>
                <p className="text-[10px] text-[#475569] truncate">
                  my B shoppy
                </p>
              </div>
            )}
          </button>

          {onToggleCollapse && isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:block p-1 rounded-lg text-[#475569] hover:text-[#a16207] hover:bg-[#f1f5f9] transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {!isCollapsed && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg text-[#475569] hover:text-rose-600 hover:bg-[#fef2f2] transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
