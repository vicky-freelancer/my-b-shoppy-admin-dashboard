import React from 'react';
import { Product, Order, ProductStats, OrderStats } from '../types';
import {
  Gem,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Package,
  Plus,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface DashboardViewProps {
  products: Product[];
  orders: Order[];
  productStats: ProductStats;
  orderStats: OrderStats;
  currencySymbol: string;
  onNavigateTab: (tab: 'products' | 'orders' | 'customers' | 'analytics') => void;
  onOpenNewProduct: () => void;
  onOpenNewOrder: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  orders,
  productStats,
  orderStats,
  currencySymbol = '₹',
  onNavigateTab,
  onOpenNewProduct,
  onOpenNewOrder,
}) => {
  const lowStockProducts = products.filter((p) => Number(p.quantity) <= 15);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#ffffff] via-[#f8fafc] to-[#ffffff] border border-black shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fffbeb] border border-[#d97706]/30 text-[#a16207] text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3" />
            MY B SHOPPY STORE EXECUTIVE OVERVIEW
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0f172a]">
            Jewellery Inventory & Order Operations
          </h2>
          <p className="text-xs text-[#475569] mt-1 max-w-xl">
            Live overview of catalog items, inventory levels, COD dispatches, and sales revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenNewProduct}
            className="px-4 py-2 rounded-xl bg-[#a16207] hover:bg-[#854d0e] text-[#ffffff] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#d97706]/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Product</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewOrder}
            className="px-4 py-2 rounded-xl bg-[#f8fafc] border border-black hover:border-[#d97706] text-[#0f172a] font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#a16207]" />
            <span>New COD Order</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Catalog Products */}
        <div className="rounded-2xl bg-[#ffffff] border border-black shadow-md hover:border-black transition-all overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8fafc] border-b border-black">
            <span className="px-2 py-0.5 rounded-md bg-[#ffffff] border border-black text-[10px] font-mono uppercase text-[#475569]">Active Products</span>
            <div className="w-7 h-7 rounded-lg bg-[#fffbeb] border border-[#d97706]/40 flex items-center justify-center text-[#a16207]">
              <Gem className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-[#0f172a] font-serif">{productStats.totalProducts}</div>
            <p className="text-[11px] text-[#475569] mt-1">
              Across <strong className="text-[#a16207]">{productStats.categoriesCount}</strong> jewellery categories
            </p>
          </div>
        </div>

        {/* Card 2: Total Inventory Units */}
        <div className="rounded-2xl bg-[#ffffff] border border-black shadow-md hover:border-black transition-all overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8fafc] border-b border-black">
            <span className="px-2 py-0.5 rounded-md bg-[#ffffff] border border-black text-[10px] font-mono uppercase text-[#475569]">Inventory In Stock</span>
            <div className="w-7 h-7 rounded-lg bg-[#fffbeb] border border-[#d97706]/40 flex items-center justify-center text-[#a16207]">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-[#0f172a] font-serif">{productStats.totalInventoryUnits}</div>
            <p className="text-[11px] text-[#475569] mt-1">
              Units ready for dispatch & sales
            </p>
          </div>
        </div>

        {/* Card 3: Total COD Orders */}
        <div className="rounded-2xl bg-[#ffffff] border border-black shadow-md hover:border-black transition-all overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8fafc] border-b border-black">
            <span className="px-2 py-0.5 rounded-md bg-[#ffffff] border border-black text-[10px] font-mono uppercase text-[#475569]">Total COD Orders</span>
            <div className="w-7 h-7 rounded-lg bg-[#fffbeb] border border-[#d97706]/40 flex items-center justify-center text-[#a16207]">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-[#0f172a] font-serif">{orderStats.total}</div>
            <p className="text-[11px] text-[#475569] mt-1">
              <strong className="text-emerald-700">{orderStats.delivered}</strong> delivered &bull;{' '}
              <strong className="text-amber-700">{orderStats.pending}</strong> pending
            </p>
          </div>
        </div>

        {/* Card 4: Catalog Valuation */}
        <div className="rounded-2xl bg-[#ffffff] border border-black shadow-md hover:border-black transition-all overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8fafc] border-b border-black">
            <span className="px-2 py-0.5 rounded-md bg-[#ffffff] border border-black text-[10px] font-mono uppercase text-[#475569]">Inventory Value</span>
            <div className="w-7 h-7 rounded-lg bg-[#fffbeb] border border-[#d97706]/40 flex items-center justify-center text-[#a16207]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-[#a16207] font-serif">
              {currencySymbol} {productStats.totalCatalogValue.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#475569] mt-1">
              Estimated catalog market value
            </p>
          </div>
        </div>
      </div>

      {/* 3. Two Columns: Low Stock Alerts & Recent Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Warning */}
        <div className="rounded-2xl bg-[#ffffff] border border-black shadow-md overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-[#f8fafc] border-b border-black">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <h3 className="font-serif font-bold text-sm text-[#0f172a]">
                Low Stock Alerts ({lowStockProducts.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="text-xs text-[#a16207] hover:underline flex items-center gap-1"
            >
              <span>Manage Products</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 space-y-2.5">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-[#f8fafc] border border-black hover:bg-[#f1f5f9] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.cover_image}
                      alt={p.title}
                      className="w-10 h-10 rounded-lg object-cover border border-black"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0f172a] truncate">{p.title}</p>
                      <p className="text-[10px] font-mono text-[#475569]">SKU: {p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {p.quantity} units left
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#475569]">
                <Package className="w-6 h-6 mx-auto mb-2 text-[#cbd5e1]" />
                <p className="text-[#334155] font-medium">No low stock items</p>
                <p className="text-[11px] text-[#64748b] mt-0.5">Inventory stock is currently healthy.</p>
              </div>
            )}
          </div>
        </div>

        {/* Featured Jewellery Items */}
        <div className="rounded-2xl bg-[#ffffff] border border-black shadow-md overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-[#f8fafc] border-b border-black">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#a16207]" />
              <h3 className="font-serif font-bold text-sm text-[#0f172a]">
                Bestseller Jewellery Showcase
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="text-xs text-[#a16207] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 space-y-2.5">
            {products.filter((p) => p.badges && p.badges.includes('Bestseller')).length > 0 ? (
              products
                .filter((p) => p.badges && p.badges.includes('Bestseller'))
                .slice(0, 4)
                .map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-[#f8fafc] border border-black hover:bg-[#f1f5f9] transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={p.cover_image}
                        alt={p.title}
                        className="w-10 h-10 rounded-lg object-cover border border-black"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#0f172a] truncate">{p.title}</p>
                        <p className="text-[10px] text-[#475569]">{p.category}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[#a16207]">
                        {currencySymbol} {p.sale_price}
                      </span>
                      <p className="text-[10px] text-[#475569] line-through">
                        {currencySymbol} {p.mrp}
                      </p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-8 text-center text-xs text-[#475569]">
                <Sparkles className="w-6 h-6 mx-auto mb-2 text-[#cbd5e1]" />
                <p className="text-[#334155] font-medium">No bestseller products</p>
                <p className="text-[11px] text-[#64748b] mt-0.5">Tag items with "Bestseller" to highlight them here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
