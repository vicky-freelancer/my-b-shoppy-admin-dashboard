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
    <div className="bg-[#ffffff] rounded-2xl border border-black shadow-sm overflow-hidden">
      {/* Top Header & Actions Bar */}
      <div className="p-4 sm:p-5 border-b border-black flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search & Category / City / Date Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#475569] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="orders-search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search orders, customers, category, address, phone..."
              className="w-full pl-10 pr-8 py-2 text-xs rounded-xl border border-black bg-[#ffffff] text-[#0f172a] placeholder:text-[#475569] hover:border-black focus:outline-none focus:ring-1 focus:ring-[#a16207] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#475569] hover:text-[#0f172a] rounded-full"
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
            className="px-3 py-2 text-xs rounded-xl border border-black bg-[#ffffff] text-[#334155] focus:outline-none focus:border-[#a16207] cursor-pointer font-medium"
          >
            <option value="all">All Categories ({uniqueCategories.length})</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat} className="bg-[#ffffff] text-[#0f172a]">
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
            className="px-3 py-2 text-xs rounded-xl border border-black bg-[#ffffff] text-[#334155] focus:outline-none focus:border-[#a16207] cursor-pointer font-medium"
          >
            <option value="all">All Cities ({uniqueCities.length})</option>
            {uniqueCities.map((c) => (
              <option key={c} value={c} className="bg-[#ffffff] text-[#0f172a]">
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
            className="px-3 py-2 text-xs rounded-xl border border-black bg-[#ffffff] text-[#334155] focus:outline-none focus:border-[#a16207] cursor-pointer font-medium"
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
              className="px-3 py-2 text-xs text-[#475569] hover:text-[#0f172a] font-medium flex items-center gap-1 transition-colors"
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
            className="px-3.5 py-2 rounded-xl border border-black bg-[#ffffff] text-xs font-semibold text-[#334155] hover:bg-[#e2e8f0] flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Export filtered orders to CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-[#a16207]" />
            <span>Export Data</span>
          </button>

          <button
            type="button"
            id="create-new-order-btn"
            onClick={onOpenNewOrderModal}
            className="px-4 py-2 rounded-xl bg-[#a16207] hover:bg-[#854d0e] text-[#ffffff] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#d97706]/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Status Tabs Bar */}
      <div className="px-4 sm:px-5 py-2 bg-[#f8fafc] border-b border-black flex items-center gap-1 overflow-x-auto scrollbar-none text-xs">
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
                  ? 'bg-[#e2e8f0] text-[#a16207] font-semibold border border-[#a16207]/30'
                  : 'text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isSelected ? 'bg-[#a16207] text-[#ffffff]' : 'bg-[#ffffff] text-[#475569]'
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
        <div className="bg-[#f8fafc] text-[#0f172a] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-black animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#a16207]">{selectedOrderIds.size} orders selected</span>
            <button
              type="button"
              onClick={() => setSelectedOrderIds(new Set())}
              className="text-[#475569] hover:text-[#0f172a] underline text-[11px] ml-2"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
              className="px-2.5 py-1 rounded-lg bg-[#f8fafc] text-[#0f172a] text-xs border border-black focus:outline-none"
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
              className="px-3 py-1 bg-[#a16207] text-[#ffffff] font-bold rounded-lg text-xs hover:bg-[#854d0e] disabled:opacity-50"
            >
              Apply Status
            </button>

            <button
              type="button"
              onClick={handleExportSelected}
              className="px-3 py-1 bg-[#e2e8f0] text-[#0f172a] font-medium rounded-lg text-xs hover:bg-[#e2e8f0] flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Export Selected
            </button>

            <button
              type="button"
              id="bulk-delete-orders-btn"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-semibold rounded-lg text-xs hover:bg-rose-100 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3 text-rose-600" />
              <span>Delete ({selectedOrderIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#f8fafc] text-[#475569] font-semibold uppercase tracking-wider border-b border-black select-none">
            <tr>
              <th className="py-3.5 px-4 w-10">
                <button
                  type="button"
                  onClick={toggleSelectAllPage}
                  className="text-[#475569] hover:text-[#0f172a] flex items-center"
                >
                  {isAllPageSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#a16207]" />
                  ) : (
                    <Square className="w-4 h-4 text-[#cbd5e1]" />
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
                  className="flex items-center gap-1 text-[#475569] hover:text-[#0f172a] font-semibold"
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
                  className="flex items-center gap-1 text-[#475569] hover:text-[#0f172a] font-semibold"
                >
                  <span>Customer</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </button>
              </th>
              <th className="py-3.5 px-3 text-[#475569]">Category</th>
              <th className="py-3.5 px-3 text-[#475569]">Address</th>
              <th className="py-3.5 px-3 text-[#475569]">Product Variant</th>
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
                  className="flex items-center gap-1 text-[#475569] hover:text-[#0f172a] font-semibold"
                >
                  <span>Order & COD Price</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </button>
              </th>
              <th className="py-3.5 px-3 text-[#475569]">Status</th>
              <th className="py-3.5 px-4 text-right text-[#475569]">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-sm">
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
                    className={`transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-[#fffbeb]'
                        : 'odd:bg-[#ffffff] even:bg-[#f8fafc] hover:bg-[#f1f5f9]'
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
                      <button type="button" className="text-[#475569] hover:text-[#0f172a] flex items-center">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#a16207]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#cbd5e1] group-hover:text-[#475569]" />
                        )}
                      </button>
                    </td>

                    {/* Order ID & Time */}
                    <td className="py-3.5 px-3">
                      <div className="font-mono font-semibold text-[#0f172a] text-xs">#{order.id}</div>
                      <div className="text-[11px] text-[#475569] flex items-center gap-1 mt-0.5 font-normal">
                        <Clock className="w-3 h-3 opacity-60" />
                        <span>{formatRelativeTime(order.created_at)}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1e293b] text-xs">{order.customer_name}</span>
                        <span className="text-[11px] text-[#475569] font-normal font-mono">{order.phone}</span>
                      </div>
                    </td>

                    {/* Category Column */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#ffffff] text-[#334155] border border-black">
                        <Tag className="w-3 h-3 mr-1 text-[#475569]" />
                        {order.category || 'General'}
                      </span>
                    </td>

                    {/* Address Column */}
                    <td className="py-3.5 px-3 max-w-[210px] text-[#475569] text-xs">
                      <div className="font-medium text-[#334155] line-clamp-1" title={order.address}>
                        {order.address || 'ΓÇö'}
                      </div>
                      <div className="text-[11px] text-[#475569] flex items-center gap-1 mt-0.5 font-normal">
                        <MapPin className="w-3 h-3 text-[#475569] shrink-0" />
                        <span className="truncate">{order.city}</span>
                      </div>
                    </td>

                    {/* Product & Qty */}
                    <td className="py-3.5 px-3 max-w-[170px]">
                      <span className="px-2 py-1 bg-[#ffffff] rounded text-[#a16207] text-xs font-medium inline-block truncate max-w-full border border-black" title={order.product_variant}>
                        {order.product_variant}
                      </span>
                      <div className="text-[11px] text-[#475569] mt-0.5 font-normal">Qty: {order.quantity}</div>
                    </td>

                    {/* COD Amount */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#a16207] text-xs">
                        {formatCurrency(orderAmt, currencySymbol)}
                      </div>
                      <div className="text-[10px] text-[#475569] font-normal">Order & COD</div>
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
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>

                        {/* Update status shortcut */}
                        <button
                          type="button"
                          onClick={() => onSelectOrder(order)}
                          className="text-[#a16207] font-medium hover:underline text-xs"
                        >
                          Update
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          id={`delete-order-btn-${order.id}`}
                          onClick={() => setDeletingOrder(order)}
                          title="Delete order"
                          className="p-1 text-[#475569] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
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
                <td colSpan={9} className="py-12 text-center text-[#475569]">
                  <Package className="w-8 h-8 mx-auto mb-2 text-[#cbd5e1]" />
                  <p className="font-medium text-[#334155] text-xs">No orders match your filter criteria</p>
                  <p className="text-[11px] text-[#475569] mt-0.5">Try clearing your filters or searching for another keyword</p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-3 px-3.5 py-1.5 bg-[#e2e8f0] text-[#a16207] rounded-xl text-xs font-semibold hover:bg-[#e2e8f0] transition-colors border border-black"
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
      <div className="p-4 border-t border-black flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#475569]">
        <div>
          Showing{' '}
          <span className="font-semibold text-[#0f172a]">
            {filteredOrders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-[#0f172a]">
            {Math.min(currentPage * pageSize, filteredOrders.length)}
          </span>{' '}
          of <span className="font-semibold text-[#0f172a]">{filteredOrders.length}</span> orders
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="prev-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-black hover:bg-[#f1f5f9] text-[#334155] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-medium text-[#334155]">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              id="next-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-black hover:bg-[#f1f5f9] text-[#334155] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
