import React, { useState, useMemo } from 'react';
import { Order, Product } from '../types';
import { Search, Users, Phone, MapPin, Mail, ShoppingBag, MessageSquare } from 'lucide-react';
import { getOrderAmount } from '../lib/utils';

interface CustomersViewProps {
  orders: Order[];
  products?: Product[];
  currencySymbol?: string;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  orders,
  products = [],
  currencySymbol = 'Γé╣',
}) => {
  const [search, setSearch] = useState('');

  // Group orders by customer phone/email
  const customers = useMemo(() => {
    const map = new Map<string, {
      name: string;
      phone: string;
      email?: string | null;
      city: string;
      address: string;
      orderCount: number;
      totalSpent: number;
      lastOrderDate: string;
    }>();

    orders.forEach((o) => {
      const key = o.phone || o.email || o.customer_name;
      const existing = map.get(key);
      const amt = getOrderAmount(o, products);

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += amt;
        if (new Date(o.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = o.created_at;
          existing.city = o.city;
          existing.address = o.address;
        }
      } else {
        map.set(key, {
          name: o.customer_name,
          phone: o.phone,
          email: o.email,
          city: o.city,
          address: o.address,
          orderCount: 1,
          totalSpent: amt,
          lastOrderDate: o.created_at,
        });
      }
    });

    return Array.from(map.values());
  }, [orders, products]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.city.toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-black bg-[#ffffff] px-5 py-4 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#0f172a] tracking-wide uppercase border-l-4 border-[#d97706] pl-3">
            CUSTOMERS
          </h2>
          <p className="text-xs text-[#475569] mt-1">
            Directory of buyers and client contact details.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md rounded-2xl border border-black bg-[#ffffff] p-2 shadow-sm">
        <Search className="w-4 h-4 text-[#475569] absolute left-5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, phone, city..."
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#f8fafc] border border-black text-[#0f172a] placeholder:text-[#64748b] focus:outline-none focus:border-[#d97706]"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-[#ffffff] border border-black shadow-md hover:border-black transition-all text-xs overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#f8fafc] border-b border-black">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#fffbeb] border border-[#d97706]/40 flex items-center justify-center font-bold text-[#a16207]">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-[#0f172a]">{customer.name}</h4>
                  <span className="text-[10px] text-[#475569]">{customer.orderCount} Order(s)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-[#a16207]">
                  {currencySymbol} {customer.totalSpent.toLocaleString()}
                </span>
                <p className="text-[10px] text-[#475569]">Total Value</p>
              </div>
            </div>

            <div className="p-5 pt-4 space-y-2 text-[#475569]">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#475569]" />
                <span className="font-mono text-[#0f172a]">{customer.phone || 'No phone'}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#475569]" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#475569] shrink-0 mt-0.5" />
                <span className="truncate">
                  {customer.address}, {customer.city}
                </span>
              </div>
            </div>

            {/* Quick action button */}
            <div className="px-5 py-3 bg-[#f8fafc] border-t border-black flex justify-end">
              <a
                href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f1f5f9] border border-black hover:border-[#15803d] text-[#15803d] text-[11px] font-semibold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Message</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
