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
  currencySymbol = '₹',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#f3e7c4] tracking-wide uppercase">
            CUSTOMERS
          </h2>
          <p className="text-xs text-[#8c7a4f] mt-1">
            Directory of buyers and client contact details.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#8c7a4f] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, phone, city..."
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#14100c] border border-[#272017] text-[#f3e7c4] placeholder:text-[#736342] focus:outline-none focus:border-[#d4af37]"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#12100e] border border-[#241e17] shadow-md hover:border-[#3d3220] transition-all text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1f1a14] mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#1c1813] border border-[#3b3223] flex items-center justify-center font-bold text-[#e5c158]">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-[#f3e7c4]">{customer.name}</h4>
                  <span className="text-[10px] text-[#8c7a4f]">{customer.orderCount} Order(s)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-[#e5c158]">
                  {currencySymbol} {customer.totalSpent.toLocaleString()}
                </span>
                <p className="text-[10px] text-[#8c7a4f]">Total Value</p>
              </div>
            </div>

            <div className="space-y-2 text-[#a39882]">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#8c7a4f]" />
                <span className="font-mono text-[#f3e7c4]">{customer.phone || 'No phone'}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#8c7a4f]" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#8c7a4f] shrink-0 mt-0.5" />
                <span className="truncate">
                  {customer.address}, {customer.city}
                </span>
              </div>
            </div>

            {/* Quick action button */}
            <div className="pt-3 mt-3 border-t border-[#1f1a14] flex justify-end">
              <a
                href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1611] border border-[#2d251a] hover:border-[#25d366] text-[#25d366] text-[11px] font-semibold transition-colors"
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
