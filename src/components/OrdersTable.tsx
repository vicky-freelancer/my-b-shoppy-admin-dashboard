import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, FilterState, Product } from '../types';
import { StatusBadge } from './StatusBadge';
import { DeleteOrderModal } from './DeleteOrderModal';
import { formatCurrency, formatRelativeTime, formatDate, exportOrdersToCSV, getOrderAmount } from '../lib/utils';
import {
  Search,
  Filter,
  Download,
  Plus,
  Phone,
  MessageSquare,
  MapPin,
  Package,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  X,
  ExternalLink,
  RefreshCw,
  Clock,
  Tag
} from 'lucide-react';

interface OrdersTableProps {
  orders: Order[];
  products?: Product[];
  onSelectOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string | number, newStatus: OrderStatus, extraUpdates?: Partial<Order>) => void;
  onDeleteOrder: (orderId: string | number) => Promise<void> | void;
  onDeleteBulkOrders?: (orderIds: (string | number)[]) => Promise<void> | void;
  onOpenNewOrderModal: () => void;
  currencySymbol: string;
  onRefresh: () => void;
  isLoading?: boolean;
  appName?: string;
  activeStatusFilter: string;
  onChangeStatusFilter: (status: string) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  products = [],
  onSelectOrder,
  onUpdateStatus,
  onDeleteOrder,
  onDeleteBulkOrders,
  onOpenNewOrderModal,
  currencySymbol,
  onRefresh,
  isLoading = false,
  appName = 'COD Admin Hub',
  activeStatusFilter,
  onChangeStatusFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'customer_name' | 'quantity' | 'amount' | 'category'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string | number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | ''>('');
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const pageSize = 10;

  // Extract unique cities
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    orders.forEach((o) => {
      if (o.city) cities.add(o.city.trim());
    });
    return Array.from(cities).sort();
  }, [orders]);

  // Extract unique categories
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    orders.forEach((o) => {
      if (o.category) categories.add(o.category.trim());
    });
    return Array.from(categories).sort();
  }, [orders]);

  // Counts by status for tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
    };
    orders.forEach((o) => {
      const s = (o.status || 'pending').toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [orders]);

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (activeStatusFilter && activeStatusFilter !== 'all') {
      result = result.filter((o) => (o.status || 'pending').toLowerCase() === activeStatusFilter.toLowerCase());
    }

    // City filter
    if (selectedCity !== 'all') {
      result = result.filter((o) => (o.city || '').toLowerCase() === selectedCity.toLowerCase());
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((o) => (o.category || 'General').toLowerCase() === selectedCategory.toLowerCase());
    }

    // Search query
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter((o) => {
        const idMatch = String(o.id).toLowerCase().includes(query);
        const nameMatch = (o.customer_name || '').toLowerCase().includes(query);
        const phoneMatch = (o.phone || '').toLowerCase().includes(query);
        const emailMatch = (o.email || '').toLowerCase().includes(query);
        const categoryMatch = (o.category || '').toLowerCase().includes(query);
        const cityMatch = (o.city || '').toLowerCase().includes(query);
        const addrMatch = (o.address || '').toLowerCase().includes(query);
        const prodMatch = (o.product_variant || '').toLowerCase().includes(query);
        const trackMatch = (o.tracking_number || '').toLowerCase().includes(query);
        return idMatch || nameMatch || phoneMatch || emailMatch || categoryMatch || cityMatch || addrMatch || prodMatch || trackMatch;
      });
    }

    // Date range filter
    if (selectedDateRange !== 'all') {
      const now = new Date();
      result = result.filter((o) => {
        if (!o.created_at) return false;
        const orderDate = new Date(o.created_at);
        const diffMs = now.getTime() - orderDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (selectedDateRange === 'today') return diffDays <= 1;
        if (selectedDateRange === '7days') return diffDays <= 7;
        if (selectedDateRange === '30days') return diffDays <= 30;
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'created_at') {
        valA = new Date(a.created_at || 0).getTime();
        valB = new Date(b.created_at || 0).getTime();
      } else if (sortBy === 'amount') {
        valA = getOrderAmount(a, products);
        valB = getOrderAmount(b, products);
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [orders, activeStatusFilter, selectedCity, selectedCategory, searchTerm, selectedDateRange, sortBy, sortOrder]);

  // Pagination slice
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Bulk selection helpers
  const isAllPageSelected =
    paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedOrderIds.has(o.id));

  const toggleSelectAllPage = () => {
    const next = new Set(selectedOrderIds);
    if (isAllPageSelected) {
      paginatedOrders.forEach((o) => next.delete(o.id));
    } else {
      paginatedOrders.forEach((o) => next.add(o.id));
    }
    setSelectedOrderIds(next);
  };

  const toggleSelectOne = (id: string | number) => {
    const next = new Set(selectedOrderIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOrderIds(next);
  };

  const handleBulkStatusApply = () => {
    if (!bulkStatus || selectedOrderIds.size === 0) return;
    selectedOrderIds.forEach((id) => {
      onUpdateStatus(id, bulkStatus);
    });
    setSelectedOrderIds(new Set());
    setBulkStatus('');
  };

  const handleExportSelected = () => {
    const toExport = orders.filter((o) => selectedOrderIds.has(o.id));
    exportOrdersToCSV(toExport.length > 0 ? toExport : filteredOrders, `cod_orders_${Date.now()}.csv`, products);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCity('all');
    setSelectedCategory('all');
    setSelectedDateRange('all');
    onChangeStatusFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCity !== 'all' ||
    selectedCategory !== 'all' ||
    selectedDateRange !== 'all' ||
    activeStatusFilter !== 'all';

  return (
    <div className="bg-[#120f0b] rounded-2xl border border-[#241e17] shadow-sm overflow-hidden">
      {/* Top Header & Actions Bar */}
      <div className="p-4 sm:p-5 border-b border-[#1f1a14] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search & Category / City / Date Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8c7a4f] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="orders-search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search orders, customers, category, address, phone..."
              className="w-full pl-10 pr-8 py-2 text-xs rounded-xl border border-[#2d251a] bg-[#18140f] text-[#f3e7c4] placeholder:text-[#8c7a4f] hover:border-[#3d3324] focus:outline-none focus:ring-1 focus:ring-[#e5c158] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#8c7a4f] hover:text-[#f3e7c4] rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            id="category-filter-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-[#2d251a] bg-[#18140f] text-[#d8cca8] focus:outline-none focus:border-[#e5c158] cursor-pointer font-medium"
          >
            <option value="all">All Categories ({uniqueCategories.length})</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat} className="bg-[#18140f] text-[#f3e7c4]">
                {cat}
              </option>
            ))}
          </select>

          {/* City Filter */}
          <select
            id="city-filter-select"
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-[#2d251a] bg-[#18140f] text-[#d8cca8] focus:outline-none focus:border-[#e5c158] cursor-pointer font-medium"
          >
            <option value="all">All Cities ({uniqueCities.length})</option>
            {uniqueCities.map((c) => (
              <option key={c} value={c} className="bg-[#18140f] text-[#f3e7c4]">
                {c}
              </option>
            ))}
          </select>

          {/* Date range filter */}
          <select
            id="date-filter-select"
            value={selectedDateRange}
            onChange={(e) => {
              setSelectedDateRange(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-[#2d251a] bg-[#18140f] text-[#d8cca8] focus:outline-none focus:border-[#e5c158] cursor-pointer font-medium"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 text-xs text-[#8c7a4f] hover:text-[#f3e7c4] font-medium flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="export-csv-btn"
            onClick={() => exportOrdersToCSV(filteredOrders, `cod_orders_${Date.now()}.csv`)}
            className="px-3.5 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-xs font-semibold text-[#d8cca8] hover:bg-[#241e17] flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Export filtered orders to CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-[#e5c158]" />
            <span>Export Data</span>
          </button>

          <button
            type="button"
            id="create-new-order-btn"
            onClick={onOpenNewOrderModal}
            className="px-4 py-2 rounded-xl bg-[#e5c158] hover:bg-[#f3cf65] text-[#0c0a09] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#d4af37]/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Status Tabs Bar */}
      <div className="px-4 sm:px-5 py-2 bg-[#0d0b09] border-b border-[#1f1a14] flex items-center gap-1 overflow-x-auto scrollbar-none text-xs">
        {[
          { key: 'all', label: 'All Orders', count: statusCounts.all },
          { key: 'pending', label: 'Pending', count: statusCounts.pending },
          { key: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed },
          { key: 'shipped', label: 'Shipped', count: statusCounts.shipped },
          { key: 'delivered', label: 'Delivered', count: statusCounts.delivered },
          { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
          { key: 'returned', label: 'Returned', count: statusCounts.returned },
        ].map((tab) => {
          const isSelected = activeStatusFilter === tab.key;
          return (
            <button
              key={tab.key}
              id={`tab-filter-${tab.key}`}
              onClick={() => {
                onChangeStatusFilter(tab.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-[#241e17] text-[#e5c158] font-semibold border border-[#e5c158]/30'
                  : 'text-[#8c7a4f] hover:text-[#f3e7c4] hover:bg-[#18140f]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isSelected ? 'bg-[#e5c158] text-[#0c0a09]' : 'bg-[#18140f] text-[#8c7a4f]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bulk Action Banner (when items are selected) */}
      {selectedOrderIds.size > 0 && (
        <div className="bg-[#1c1712] text-[#f3e7c4] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[#2d251a] animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#e5c158]">{selectedOrderIds.size} orders selected</span>
            <button
              type="button"
              onClick={() => setSelectedOrderIds(new Set())}
              className="text-[#8c7a4f] hover:text-[#f3e7c4] underline text-[11px] ml-2"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
              className="px-2.5 py-1 rounded-lg bg-[#14100c] text-[#f3e7c4] text-xs border border-[#2d251a] focus:outline-none"
            >
              <option value="">Change status to...</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered (Cash Collected)</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>

            <button
              type="button"
              onClick={handleBulkStatusApply}
              disabled={!bulkStatus}
              className="px-3 py-1 bg-[#e5c158] text-[#0c0a09] font-bold rounded-lg text-xs hover:bg-[#f3cf65] disabled:opacity-50"
            >
              Apply Status
            </button>

            <button
              type="button"
              onClick={handleExportSelected}
              className="px-3 py-1 bg-[#241e17] text-[#f3e7c4] font-medium rounded-lg text-xs hover:bg-[#2d251a] flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Export Selected
            </button>

            <button
              type="button"
              id="bulk-delete-orders-btn"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3 py-1 bg-rose-950/60 border border-rose-800/40 text-rose-300 font-semibold rounded-lg text-xs hover:bg-rose-900/60 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Delete ({selectedOrderIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#0e0c0a] text-[#8c7a4f] font-semibold uppercase tracking-wider border-b border-[#1f1a14] select-none">
            <tr>
              <th className="py-3.5 px-4 w-10">
                <button
                  type="button"
                  onClick={toggleSelectAllPage}
                  className="text-[#8c7a4f] hover:text-[#f3e7c4] flex items-center"
                >
                  {isAllPageSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#e5c158]" />
                  ) : (
                    <Square className="w-4 h-4 text-[#3d3324]" />
                  )}
                </button>
              </th>
              <th className="py-3.5 px-3">
                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === 'created_at') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortBy('created_at');
                      setSortOrder('desc');
                    }
                  }}
                  className="flex items-center gap-1 text-[#a39882] hover:text-[#f3e7c4] font-semibold"
                >
                  <span>Order ID / Time</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </button>
              </th>
              <th className="py-3.5 px-3">
                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === 'customer_name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortBy('customer_name');
                      setSortOrder('asc');
                    }
                  }}
                  className="flex items-center gap-1 text-[#a39882] hover:text-[#f3e7c4] font-semibold"
                >
                  <span>Customer</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </button>
              </th>
              <th className="py-3.5 px-3 text-[#a39882]">Category</th>
              <th className="py-3.5 px-3 text-[#a39882]">Address</th>
              <th className="py-3.5 px-3 text-[#a39882]">Product Variant</th>
              <th className="py-3.5 px-3">
                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === 'amount') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortBy('amount');
                      setSortOrder('desc');
                    }
                  }}
                  className="flex items-center gap-1 text-[#a39882] hover:text-[#f3e7c4] font-semibold"
                >
                  <span>Order & COD Price</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </button>
              </th>
              <th className="py-3.5 px-3 text-[#a39882]">Status</th>
              <th className="py-3.5 px-4 text-right text-[#a39882]">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#18140f] text-sm">
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => {
                const isSelected = selectedOrderIds.has(order.id);
                const orderAmt = getOrderAmount(order, products);
                const whatsappPhone = order.phone.replace(/[^0-9]/g, '');
                const whatsappMsg = encodeURIComponent(
                  `Hi ${order.customer_name}, verifying your Cash on Delivery order #${order.id} for "${order.product_variant}". Order & COD Price: ${formatCurrency(orderAmt, currencySymbol)}. Delivery Address: ${order.address}, ${order.city}. Please reply to confirm.`
                );

                return (
                  <tr
                    key={order.id}
                    id={`order-row-${order.id}`}
                    onClick={() => onSelectOrder(order)}
                    className={`hover:bg-[#18140f] transition-colors cursor-pointer group ${
                      isSelected ? 'bg-[#1e1811]' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-3.5 px-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectOne(order.id);
                      }}
                    >
                      <button type="button" className="text-[#8c7a4f] hover:text-[#f3e7c4] flex items-center">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#e5c158]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#3d3324] group-hover:text-[#8c7a4f]" />
                        )}
                      </button>
                    </td>

                    {/* Order ID & Time */}
                    <td className="py-3.5 px-3">
                      <div className="font-mono font-semibold text-[#f3e7c4] text-xs">#{order.id}</div>
                      <div className="text-[11px] text-[#8c7a4f] flex items-center gap-1 mt-0.5 font-normal">
                        <Clock className="w-3 h-3 opacity-60" />
                        <span>{formatRelativeTime(order.created_at)}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#e8ded1] text-xs">{order.customer_name}</span>
                        <span className="text-[11px] text-[#8c7a4f] font-normal font-mono">{order.phone}</span>
                      </div>
                    </td>

                    {/* Category Column */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#1a1510] text-[#c4b595] border border-[#2d251a]">
                        <Tag className="w-3 h-3 mr-1 text-[#8c7a4f]" />
                        {order.category || 'General'}
                      </span>
                    </td>

                    {/* Address Column */}
                    <td className="py-3.5 px-3 max-w-[210px] text-[#a39882] text-xs">
                      <div className="font-medium text-[#d8cca8] line-clamp-1" title={order.address}>
                        {order.address || '—'}
                      </div>
                      <div className="text-[11px] text-[#8c7a4f] flex items-center gap-1 mt-0.5 font-normal">
                        <MapPin className="w-3 h-3 text-[#8c7a4f] shrink-0" />
                        <span className="truncate">{order.city}</span>
                      </div>
                    </td>

                    {/* Product & Qty */}
                    <td className="py-3.5 px-3 max-w-[170px]">
                      <span className="px-2 py-1 bg-[#1a1510] rounded text-[#e5c158] text-xs font-medium inline-block truncate max-w-full border border-[#262018]" title={order.product_variant}>
                        {order.product_variant}
                      </span>
                      <div className="text-[11px] text-[#8c7a4f] mt-0.5 font-normal">Qty: {order.quantity}</div>
                    </td>

                    {/* COD Amount */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#e5c158] text-xs">
                        {formatCurrency(orderAmt, currencySymbol)}
                      </div>
                      <div className="text-[10px] text-[#8c7a4f] font-normal">Order & COD</div>
                    </td>

                    {/* Interactive Status Badge */}
                    <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge
                        status={order.status}
                        orderId={order.id}
                        interactive
                        onStatusChange={(newStatus) => onUpdateStatus(order.id, newStatus)}
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp button */}
                        <a
                          href={`https://wa.me/${whatsappPhone}?text=${whatsappMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp confirmation message"
                          className="p-1.5 text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>

                        {/* Update status shortcut */}
                        <button
                          type="button"
                          onClick={() => onSelectOrder(order)}
                          className="text-[#e5c158] font-medium hover:underline text-xs"
                        >
                          Update
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          id={`delete-order-btn-${order.id}`}
                          onClick={() => setDeletingOrder(order)}
                          title="Delete order"
                          className="p-1 text-[#8c7a4f] hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#8c7a4f]">
                  <Package className="w-8 h-8 mx-auto mb-2 text-[#3d3324]" />
                  <p className="font-medium text-[#d8cca8] text-xs">No orders match your filter criteria</p>
                  <p className="text-[11px] text-[#8c7a4f] mt-0.5">Try clearing your filters or searching for another keyword</p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-3 px-3.5 py-1.5 bg-[#1f1a14] text-[#e5c158] rounded-xl text-xs font-semibold hover:bg-[#28221a] transition-colors border border-[#2d251a]"
                    >
                      Reset All Filters
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-[#1f1a14] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8c7a4f]">
        <div>
          Showing{' '}
          <span className="font-semibold text-[#f3e7c4]">
            {filteredOrders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-[#f3e7c4]">
            {Math.min(currentPage * pageSize, filteredOrders.length)}
          </span>{' '}
          of <span className="font-semibold text-[#f3e7c4]">{filteredOrders.length}</span> orders
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="prev-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#2d251a] hover:bg-[#18140f] text-[#d8cca8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-medium text-[#d8cca8]">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              id="next-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#2d251a] hover:bg-[#18140f] text-[#d8cca8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Single Order Modal */}
      {deletingOrder && (
        <DeleteOrderModal
          order={deletingOrder}
          isOpen={!!deletingOrder}
          onClose={() => setDeletingOrder(null)}
          onConfirmSingle={async (orderId) => {
            await onDeleteOrder(orderId);
            setDeletingOrder(null);
          }}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Delete Multiple Orders (Bulk) Modal */}
      {isBulkDeleteModalOpen && (
        <DeleteOrderModal
          order={null}
          bulkOrderIds={Array.from(selectedOrderIds)}
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirmSingle={async (orderId) => {
            await onDeleteOrder(orderId);
          }}
          onConfirmBulk={async (orderIds) => {
            if (onDeleteBulkOrders) {
              await onDeleteBulkOrders(orderIds);
            } else {
              for (const id of orderIds) {
                await onDeleteOrder(id);
              }
            }
            setSelectedOrderIds(new Set());
            setIsBulkDeleteModalOpen(false);
          }}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
};
