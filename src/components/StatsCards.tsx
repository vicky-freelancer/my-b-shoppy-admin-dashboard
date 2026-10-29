import React from 'react';
import { OrderStats } from '../types';
import { formatCurrency } from '../lib/utils';
import { Package, Clock, Truck, DollarSign } from 'lucide-react';

interface StatsCardsProps {
  stats: OrderStats;
  currencySymbol: string;
  activeStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  currencySymbol,
  activeStatusFilter,
  onSelectStatusFilter,
}) => {
  const cards = [
    {
      id: 'all',
      title: 'Total Orders',
      value: stats.total.toLocaleString(),
      subValue: `${formatCurrency(stats.totalRevenue, currencySymbol)} Est. Volume`,
      subColor: 'text-[#a16207]',
      icon: Package,
      activeBorder: 'border-[#a16207] ring-2 ring-[#a16207]/20 bg-[#fffbeb]',
      iconBg: 'bg-[#e2e8f0] text-[#a16207]',
    },
    {
      id: 'pending',
      title: 'Pending COD',
      value: stats.pending.toLocaleString(),
      subValue: `${stats.pending} awaiting verification call`,
      subColor: 'text-amber-700',
      icon: Clock,
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50',
      iconBg: 'bg-amber-50 text-amber-700',
    },
    {
      id: 'shipped',
      title: 'In Transit',
      value: stats.shipped.toLocaleString(),
      subValue: 'Active courier dispatches',
      subColor: 'text-blue-600',
      icon: Truck,
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50',
      iconBg: 'bg-blue-50 text-blue-700',
    },
    {
      id: 'delivered',
      title: 'Deliveries & Cash',
      value: `${formatCurrency(stats.collectedRevenue, currencySymbol)}`,
      subValue: `${stats.deliverySuccessRate}% success (${stats.delivered} collected)`,
      subColor: 'text-emerald-700',
      icon: DollarSign,
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50',
      iconBg: 'bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeStatusFilter === card.id;

        return (
          <div
            key={card.id}
            id={`stat-card-${card.id}`}
            onClick={() => onSelectStatusFilter(isActive && card.id !== 'all' ? 'all' : card.id)}
            className={`cursor-pointer group relative bg-[#ffffff] rounded-2xl border shadow-sm transition-all duration-150 hover:border-black overflow-hidden ${
              isActive
                ? card.activeBorder
                : 'border-black'
            }`}
          >
            <div className={`flex items-center justify-between px-4 py-2.5 border-b border-black ${
              isActive ? 'bg-[#fffbeb]' : 'bg-[#f8fafc]'
            }`}>
              <p className="px-2 py-0.5 rounded-md bg-[#ffffff] border border-black text-[10px] font-semibold text-[#475569] uppercase tracking-wider">
                {card.title}
              </p>
              <div className={`p-1.5 rounded-lg ${card.iconBg} transition-transform group-hover:scale-105`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-bold text-[#0f172a] tracking-tight">
                  {card.value}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-medium mt-2">
                <p className={`truncate ${card.subColor}`}>{card.subValue}</p>
                {isActive && (
                  <span className="text-[10px] font-semibold text-[#a16207] bg-[#ffffff] border border-[#a16207]/40 px-2 py-0.5 rounded-md">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
