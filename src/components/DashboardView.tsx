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
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#18140e] via-[#1f1911] to-[#14100c] border border-[#2d251a] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#241e15] border border-[#d4af37]/30 text-[#e5c158] text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3" />
            MY B SHOPPY STORE EXECUTIVE OVERVIEW
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#f3e7c4]">
            Jewellery Inventory & Order Operations
          </h2>
          <p className="text-xs text-[#8c7a4f] mt-1 max-w-xl">
            Live overview of catalog items, inventory levels, COD dispatches, and sales revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenNewProduct}
            className="px-4 py-2 rounded-xl bg-[#e5c158] hover:bg-[#f3cf65] text-[#0c0a09] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#d4af37]/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Product</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewOrder}
            className="px-4 py-2 rounded-xl bg-[#1c1813] border border-[#2d251a] hover:border-[#d4af37] text-[#f3e7c4] font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#e5c158]" />
            <span>New COD Order</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Catalog Products */}
        <div className="p-5 rounded-2xl bg-[#12100e] border border-[#241e17] shadow-md hover:border-[#382f23] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#8c7a4f]">Active Products</span>
            <div className="w-8 h-8 rounded-xl bg-[#1f1911] border border-[#d4af37]/40 flex items-center justify-center text-[#e5c158]">
              <Gem className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#f3e7c4] font-serif">{productStats.totalProducts}</div>
            <p className="text-[11px] text-[#8c7a4f] mt-1">
              Across <strong className="text-[#e5c158]">{productStats.categoriesCount}</strong> jewellery categories
            </p>
          </div>
        </div>

        {/* Card 2: Total Inventory Units */}
        <div className="p-5 rounded-2xl bg-[#12100e] border border-[#241e17] shadow-md hover:border-[#382f23] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#8c7a4f]">Inventory In Stock</span>
            <div className="w-8 h-8 rounded-xl bg-[#1f1911] border border-[#d4af37]/40 flex items-center justify-center text-[#e5c158]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#f3e7c4] font-serif">{productStats.totalInventoryUnits}</div>
            <p className="text-[11px] text-[#8c7a4f] mt-1">
              Units ready for dispatch & sales
            </p>
          </div>
        </div>

        {/* Card 3: Total COD Orders */}
        <div className="p-5 rounded-2xl bg-[#12100e] border border-[#241e17] shadow-md hover:border-[#382f23] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#8c7a4f]">Total COD Orders</span>
            <div className="w-8 h-8 rounded-xl bg-[#1f1911] border border-[#d4af37]/40 flex items-center justify-center text-[#e5c158]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#f3e7c4] font-serif">{orderStats.total}</div>
            <p className="text-[11px] text-[#8c7a4f] mt-1">
              <strong className="text-emerald-400">{orderStats.delivered}</strong> delivered &bull;{' '}
              <strong className="text-amber-400">{orderStats.pending}</strong> pending
            </p>
          </div>
        </div>

        {/* Card 4: Catalog Valuation */}
        <div className="p-5 rounded-2xl bg-[#12100e] border border-[#241e17] shadow-md hover:border-[#382f23] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#8c7a4f]">Inventory Value</span>
            <div className="w-8 h-8 rounded-xl bg-[#1f1911] border border-[#d4af37]/40 flex items-center justify-center text-[#e5c158]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#e5c158] font-serif">
              {currencySymbol} {productStats.totalCatalogValue.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#8c7a4f] mt-1">
              Estimated catalog market value
            </p>
          </div>
        </div>
      </div>

      {/* 3. Two Columns: Low Stock Alerts & Recent Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Warning */}
        <div className="p-5 rounded-2xl bg-[#12100e] border border-[#241e17] shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f1a14] mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-serif font-bold text-sm text-[#f3e7c4]">
                Low Stock Alerts ({lowStockProducts.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="text-xs text-[#e5c158] hover:underline flex items-center gap-1"
            >
              <span>Manage Products</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-[#16120d] border border-[#272017] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.cover_image}
                      alt={p.title}
                      className="w-10 h-10 rounded-lg object-cover border border-[#2f271d]"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#f3e7c4] truncate">{p.title}</p>
                      <p className="text-[10px] font-mono text-[#8c7a4f]">SKU: {p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                      {p.quantity} units left
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#8c7a4f]">
                <Package className="w-6 h-6 mx-auto mb-2 text-[#4a3e2e]" />
                <p className="text-[#d8cca8] font-medium">No low stock items</p>
                <p className="text-[11px] text-[#736342] mt-0.5">Inventory stock is currently healthy.</p>
              </div>
            )}
          </div>
        </div>

        {/* Featured Jewellery Items */}
        <div className="p-5 rounded-2xl bg-[#12100e] border border-[#241e17] shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f1a14] mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#e5c158]" />
              <h3 className="font-serif font-bold text-sm text-[#f3e7c4]">
                Bestseller Jewellery Showcase
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="text-xs text-[#e5c158] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {products.filter((p) => p.badges && p.badges.includes('Bestseller')).length > 0 ? (
              products
                .filter((p) => p.badges && p.badges.includes('Bestseller'))
                .slice(0, 4)
                .map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-[#16120d] border border-[#272017] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={p.cover_image}
                        alt={p.title}
                        className="w-10 h-10 rounded-lg object-cover border border-[#2f271d]"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#f3e7c4] truncate">{p.title}</p>
                        <p className="text-[10px] text-[#8c7a4f]">{p.category}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[#e5c158]">
                        {currencySymbol} {p.sale_price}
                      </span>
                      <p className="text-[10px] text-[#8c7a4f] line-through">
                        {currencySymbol} {p.mrp}
                      </p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-8 text-center text-xs text-[#8c7a4f]">
                <Sparkles className="w-6 h-6 mx-auto mb-2 text-[#4a3e2e]" />
                <p className="text-[#d8cca8] font-medium">No bestseller products</p>
                <p className="text-[11px] text-[#736342] mt-0.5">Tag items with "Bestseller" to highlight them here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
