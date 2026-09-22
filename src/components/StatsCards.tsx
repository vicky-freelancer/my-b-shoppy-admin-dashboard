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
      subColor: 'text-[#e5c158]',
      icon: Package,
      activeBorder: 'border-[#e5c158] ring-2 ring-[#e5c158]/20 bg-[#1f1a12]',
      iconBg: 'bg-[#241e17] text-[#e5c158]',
    },
    {
      id: 'pending',
      title: 'Pending COD',
      value: stats.pending.toLocaleString(),
      subValue: `${stats.pending} awaiting verification call`,
      subColor: 'text-amber-400',
      icon: Clock,
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-950/20',
      iconBg: 'bg-amber-950/40 text-amber-400',
    },
    {
      id: 'shipped',
      title: 'In Transit',
      value: stats.shipped.toLocaleString(),
      subValue: 'Active courier dispatches',
      subColor: 'text-blue-400',
      icon: Truck,
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-950/20',
      iconBg: 'bg-blue-950/40 text-blue-400',
    },
    {
      id: 'delivered',
      title: 'Deliveries & Cash',
      value: `${formatCurrency(stats.collectedRevenue, currencySymbol)}`,
      subValue: `${stats.deliverySuccessRate}% success (${stats.delivered} collected)`,
      subColor: 'text-emerald-400',
      icon: DollarSign,
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-950/20',
      iconBg: 'bg-emerald-950/40 text-emerald-400',
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
            className={`cursor-pointer group relative bg-[#120f0b] rounded-2xl p-5 border shadow-sm transition-all duration-150 hover:border-[#382f22] ${
              isActive
                ? card.activeBorder
                : 'border-[#241e17]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#8c7a4f] uppercase tracking-wider">
                {card.title}
              </p>
              <div className={`p-1.5 rounded-lg ${card.iconBg} transition-transform group-hover:scale-105`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl sm:text-3xl font-bold text-[#f3e7c4] tracking-tight">
                {card.value}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-medium mt-2">
              <p className={`truncate ${card.subColor}`}>{card.subValue}</p>
              {isActive && (
                <span className="text-[10px] font-semibold text-[#e5c158] bg-[#241e17] border border-[#e5c158]/40 px-2 py-0.5 rounded-md">
                  Active
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
