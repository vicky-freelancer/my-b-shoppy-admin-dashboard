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
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  adminUser: AdminUser | null;
  onOpenSettings: () => void;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  ordersCount?: number;
  productsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  adminUser,
  onOpenSettings,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
  ordersCount = 0,
  productsCount = 0,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
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
      className={`bg-[#0c0a09] border-r border-[#241e17] flex flex-col justify-between shrink-0 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand Header */}
      <div>
        <div className="p-5 border-b border-[#1f1a14] flex items-center justify-between">
          {!isCollapsed ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-black tracking-widest text-[#e5c158] uppercase">
                  MY B SHOPPY
                </span>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#8c7a4f] mt-0.5">
                MANAGEMENT
              </p>
            </div>
          ) : (
            <div className="mx-auto w-10 h-10 rounded-xl bg-[#1c1813] border border-[#d4af37]/40 flex items-center justify-center text-[#e5c158] font-serif font-bold text-base shadow-sm shadow-[#d4af37]/10">
              B
            </div>
          )}

          {onToggleCollapse && !isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-lg text-[#8c7a4f] hover:text-[#e5c158] hover:bg-[#1a1612] transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 mt-2">
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
                    ? 'bg-[#1a1611] text-[#e5c158] border border-[#d4af37]/60 shadow-md shadow-black/40 font-semibold'
                    : 'text-[#a39882] hover:text-[#f3e7c4] hover:bg-[#15120e] border border-transparent'
                }`}
                title={item.label}
              >
                <div
                  className={`flex items-center justify-center ${
                    isActive ? 'text-[#e5c158]' : 'text-[#8c7a4f] group-hover:text-[#e5c158]'
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
                        ? 'bg-[#e5c158] text-[#0c0a09]'
                        : 'bg-[#211c16] text-[#c9b787] border border-[#382f23]'
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
      <div className="p-3 border-t border-[#1f1a14] space-y-2">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-[#14100c] border border-[#241e17] ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition-opacity"
            title="Open Settings"
          >
            <div className="w-8 h-8 rounded-lg bg-[#211c15] border border-[#3b3223] flex items-center justify-center text-[#e5c158] shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#f3e7c4] leading-tight truncate">
                  {adminUser?.name || 'Admin'}
                </p>
                <p className="text-[10px] text-[#8c7a4f] truncate">
                  my B shoppy
                </p>
              </div>
            )}
          </button>

          {onToggleCollapse && isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-lg text-[#8c7a4f] hover:text-[#e5c158] hover:bg-[#1a1612] transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {!isCollapsed && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg text-[#8c7a4f] hover:text-rose-400 hover:bg-[#1e1414] transition-colors"
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
