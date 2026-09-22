import React from 'react';
import { OrderStats } from '../types';
import { MapPin, ShieldCheck } from 'lucide-react';

interface AnalyticsPanelProps {
  stats: OrderStats;
  currencySymbol: string;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ stats }) => {
  const statusItems = [
    { label: 'Pending Call', count: stats.pending, color: 'bg-amber-400', textColor: 'text-amber-300' },
    { label: 'Confirmed', count: stats.confirmed, color: 'bg-blue-400', textColor: 'text-blue-300' },
    { label: 'In Transit', count: stats.shipped, color: 'bg-blue-500', textColor: 'text-blue-300' },
    { label: 'Delivered (Paid)', count: stats.delivered, color: 'bg-emerald-400', textColor: 'text-emerald-300' },
    { label: 'Cancelled / RTO', count: stats.cancelled + stats.returned, color: 'bg-rose-400', textColor: 'text-rose-300' },
  ];

  const total = stats.total || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      {/* Status Pipeline Progress Bar */}
      <div className="bg-[#120f0b] rounded-2xl p-5 border border-[#241e17] shadow-sm lg:col-span-2 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#e5c158]" />
              <h3 className="text-sm font-semibold text-[#f3e7c4]">COD Fulfillment Pipeline</h3>
            </div>
            <span className="text-xs text-[#8c7a4f] font-medium">
              {stats.deliverySuccessRate}% Success Rate
            </span>
          </div>

          {/* Stacked bar */}
          <div className="h-3 w-full bg-[#1b1611] rounded-full overflow-hidden flex p-0.5 gap-0.5 mb-4 border border-[#241e17]">
            {statusItems.map((item) => {
              const pct = (item.count / total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={item.label}
                  style={{ width: `${pct}%` }}
                  title={`${item.label}: ${item.count} (${Math.round(pct)}%)`}
                  className={`h-full rounded-sm transition-all duration-500 ${item.color}`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {statusItems.map((item) => (
              <div key={item.label} className="flex flex-col bg-[#18140f] p-2.5 rounded-xl border border-[#262018]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-[11px] font-medium text-[#c4b595] truncate">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-[#f3e7c4] ml-3.5">
                  {item.count} <span className="text-[10px] font-normal text-[#8c7a4f]">({Math.round((item.count / total) * 100)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Delivery Hubs & Cities */}
      <div className="bg-[#120f0b] rounded-2xl p-5 border border-[#241e17] shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#e5c158]" />
              <h3 className="text-sm font-semibold text-[#f3e7c4]">Top Delivery Destinations</h3>
            </div>
            <span className="text-xs font-medium text-[#8c7a4f]">By Orders</span>
          </div>

          <div className="space-y-2.5">
            {stats.topCities.length > 0 ? (
              stats.topCities.map((item, idx) => {
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.city} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 text-[11px] font-semibold text-[#8c7a4f]">#{idx + 1}</span>
                      <span className="font-medium text-[#e8ded1] truncate">{item.city}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 h-1.5 bg-[#1b1611] rounded-full overflow-hidden border border-[#241e17]">
                        <div
                          className="h-full bg-[#e5c158] rounded-full"
                          style={{ width: `${Math.min(100, pct * 2.5)}%` }}
                        />
                      </div>
                      <span className="text-[#c4b595] font-semibold w-7 text-right">{item.count}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#8c7a4f] italic">No destination data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
