import React from 'react';
import { OrderStats } from '../types';
import { MapPin, ShieldCheck } from 'lucide-react';

interface AnalyticsPanelProps {
  stats: OrderStats;
  currencySymbol: string;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ stats }) => {
  const statusItems = [
    { label: 'Pending Call', count: stats.pending, color: 'bg-amber-400', textColor: 'text-amber-700' },
    { label: 'Confirmed', count: stats.confirmed, color: 'bg-blue-400', textColor: 'text-blue-700' },
    { label: 'Shipped', count: stats.shipped, color: 'bg-blue-500', textColor: 'text-blue-700' },
    { label: 'Delivered (Paid)', count: stats.delivered, color: 'bg-emerald-400', textColor: 'text-emerald-700' },
    { label: 'Cancelled / RTO', count: stats.cancelled + stats.returned, color: 'bg-rose-400', textColor: 'text-rose-700' },
  ];

  const total = stats.total || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      {/* Status Pipeline Progress Bar */}
      <div className="bg-[#ffffff] rounded-2xl p-5 border border-black shadow-sm lg:col-span-2 flex flex-col justify-between overflow-hidden">
        <div>
          <div className="-mx-5 -mt-5 mb-4 px-5 py-3 bg-[#f8fafc] border-b border-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#a16207]" />
              <h3 className="text-sm font-semibold text-[#0f172a]">COD Fulfillment Pipeline</h3>
            </div>
            <span className="text-xs text-[#475569] font-medium">
              {stats.deliverySuccessRate}% Success Rate
            </span>
          </div>

          {/* Stacked bar */}
          <div className="h-3 w-full bg-[#f1f5f9] rounded-full overflow-hidden flex p-0.5 gap-0.5 mb-4 border border-black">
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
              <div key={item.label} className="flex flex-col bg-[#f8fafc] p-2.5 rounded-xl border border-black">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-[11px] font-medium text-[#334155] truncate">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-[#0f172a] ml-3.5">
                  {item.count} <span className="text-[10px] font-normal text-[#475569]">({Math.round((item.count / total) * 100)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Delivery Hubs & Cities */}
      <div className="bg-[#ffffff] rounded-2xl p-5 border border-black shadow-sm flex flex-col justify-between overflow-hidden">
        <div>
          <div className="-mx-5 -mt-5 mb-4 px-5 py-3 bg-[#f8fafc] border-b border-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#a16207]" />
              <h3 className="text-sm font-semibold text-[#0f172a]">Top Delivery Destinations</h3>
            </div>
            <span className="text-xs font-medium text-[#475569]">By Orders</span>
          </div>

          <div className="space-y-2.5">
            {stats.topCities.length > 0 ? (
              stats.topCities.map((item, idx) => {
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.city} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-[#f8fafc] border border-black">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 text-[11px] font-semibold text-[#475569]">#{idx + 1}</span>
                      <span className="font-medium text-[#1e293b] truncate">{item.city}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden border border-black">
                        <div
                          className="h-full bg-[#a16207] rounded-full"
                          style={{ width: `${Math.min(100, pct * 2.5)}%` }}
                        />
                      </div>
                      <span className="text-[#334155] font-semibold w-7 text-right">{item.count}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#475569] italic">No destination data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
