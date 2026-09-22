import React, { useState, useRef, useEffect } from 'react';
import { getStatusConfig } from '../lib/utils';
import { OrderStatus } from '../types';
import { ChevronDown, Check } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  orderId?: string | number;
  interactive?: boolean;
  onStatusChange?: (newStatus: OrderStatus) => void;
  size?: 'sm' | 'md' | 'lg';
}

const AVAILABLE_STATUSES: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Pending Verification' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered (Collected)' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'returned', label: 'Returned (RTO)' },
];

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  interactive = false,
  onStatusChange,
  size = 'md',
}) => {
  const config = getStatusConfig(status);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-medium',
  };

  const badgeContent = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-all ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} ${sizeClasses[size]} ${
        interactive ? 'cursor-pointer hover:shadow-xs hover:scale-[1.02] select-none active:scale-[0.98]' : ''
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotColor} ${status === 'pending' ? 'animate-pulse' : ''}`} />
      <span className="truncate max-w-[140px]">{config.label}</span>
      {interactive && <ChevronDown className="w-3 h-3 ml-0.5 opacity-60 shrink-0" />}
    </span>
  );

  if (!interactive || !onStatusChange) {
    return badgeContent;
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        id={`status-badge-btn-${status}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="focus:outline-none"
      >
        {badgeContent}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-52 rounded-xl bg-[#16120d] shadow-2xl border border-[#2d251a] py-1.5 z-50 text-xs font-medium animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1 text-[10px] font-semibold text-[#8c7a4f] uppercase tracking-wider">
            Update Order Status
          </div>
          {AVAILABLE_STATUSES.map((item) => {
            const isSelected = (status || '').toLowerCase() === item.key;
            const itemCfg = getStatusConfig(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(item.key);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#241e17] transition-colors ${
                  isSelected ? 'bg-[#261f14] text-[#e5c158] font-semibold' : 'text-[#e8ded1]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${itemCfg.dotColor}`} />
                  <span>{item.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#e5c158]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
