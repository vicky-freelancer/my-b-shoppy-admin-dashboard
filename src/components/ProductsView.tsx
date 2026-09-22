import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import {
  Search,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Tag,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Database,
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  onOpenAddModal: () => void;
  onEditProduct: (product: Product) => void;
  onDuplicateProduct: (productId: string | number) => Promise<void>;
  onDeletePrompt: (product: Product) => void;
  currencySymbol?: string;
  isLoading?: boolean;
  onOpenSqlSetup?: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onOpenAddModal,
  onEditProduct,
  onDuplicateProduct,
  onDeletePrompt,
  currencySymbol = '₹',
  isLoading = false,
  onOpenSqlSetup,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'in' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'mrp' | 'sale_price' | 'quantity' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.badges && p.badges.some((b) => b.toLowerCase().includes(q)))
      );
    }

    // Category
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Stock Filter
    if (selectedStockFilter === 'in') {
      result = result.filter((p) => Number(p.quantity) > 15);
    } else if (selectedStockFilter === 'low') {
      result = result.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= 15);
    } else if (selectedStockFilter === 'out') {
      result = result.filter((p) => Number(p.quantity) === 0);
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'title') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (sortBy === 'created_at') {
        const timeA = new Date(valA || 0).getTime();
        const timeB = new Date(valB || 0).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });

    return result;
  }, [products, searchTerm, selectedCategory, selectedStockFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#f3e7c4] tracking-wide uppercase">
            PRODUCTS
          </h2>
          <p className="text-xs text-[#8c7a4f] mt-1">
            Manage your jewellery catalog inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {onOpenSqlSetup && (
            <button
              type="button"
              id="supabase-sql-btn"
              onClick={onOpenSqlSetup}
              className="px-3.5 py-2.5 rounded-xl bg-[#1c1711] hover:bg-[#261f17] text-[#e5c158] border border-[#3d3220] font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title="View and copy Supabase SQL table setup script"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase SQL Setup</span>
            </button>
          )}

          {/* Prominent Gold Button */}
          <button
            type="button"
            id="add-new-product-btn"
            onClick={onOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-[#e5c158] hover:bg-[#f3cf65] text-[#0c0a09] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#d4af37]/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ADD NEW PRODUCT</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search by title, SKU */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8c7a4f] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="products-search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by title, SKU..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#14100c] border border-[#272017] text-[#f3e7c4] placeholder:text-[#736342] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 transition-all"
          />
        </div>

        {/* Category Dropdown */}
        <div className="w-full sm:w-56">
          <select
            id="products-category-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#14100c] border border-[#272017] text-[#e5c158] font-medium focus:outline-none focus:border-[#d4af37] cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Products Table */}
      <div className="bg-[#12100e] rounded-2xl border border-[#241e17] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#241e17] bg-[#16120d] text-[#8c7a4f] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-4 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1 hover:text-[#e5c158]"
                  >
                    PRODUCT
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
                <th className="py-4 px-3 font-semibold">CATEGORY</th>
                <th className="py-4 px-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('mrp')}
                    className="flex items-center gap-1 hover:text-[#e5c158]"
                  >
                    MRP
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
                <th className="py-4 px-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('sale_price')}
                    className="flex items-center gap-1 hover:text-[#e5c158]"
                  >
                    SALE PRICE
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
                <th className="py-4 px-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('quantity')}
                    className="flex items-center gap-1 hover:text-[#e5c158]"
                  >
                    STOCK
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
                <th className="py-4 px-3 font-semibold">BADGES</th>
                <th className="py-4 px-4 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1e1913]">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => {
                  const qty = Number(product.quantity) || 0;
                  const isLow = qty > 0 && qty <= 15;
                  const isOut = qty === 0;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#18140f] transition-colors group"
                    >
                      {/* 1. PRODUCT (Image + Title + SKU) */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#2f271d] bg-[#1a1611] shrink-0">
                            <img
                              src={product.cover_image}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=300&auto=format&fit=crop&q=80';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-[#f3e7c4] text-xs truncate max-w-[200px]">
                              {product.title}
                            </h3>
                            <p className="text-[10px] font-mono text-[#8c7a4f] mt-0.5 uppercase tracking-wide">
                              SKU: {product.sku}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. CATEGORY */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-block px-3 py-1 rounded-md text-[11px] font-medium bg-[#1c1712] text-[#d8cca8] border border-[#2e261b]">
                          {product.category || 'Jewellery'}
                        </span>
                      </td>

                      {/* 3. MRP */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium text-[#8c7a4f]">
                        <span className="line-through decoration-[#8c7a4f]/60">
                          {currencySymbol} {product.mrp || product.sale_price}
                        </span>
                      </td>

                      {/* 4. SALE PRICE (Highlighted tag) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#1e1911] border border-[#d4af37]/40 text-[#e5c158] font-bold">
                          {currencySymbol} {product.sale_price}
                        </div>
                      </td>

                      {/* 5. STOCK & STATUS */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#f3e7c4]">{qty}</span>
                          {isOut ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/40">
                              Out
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                              Low
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                              In
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. BADGES */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-[180px]">
                          {product.badges && product.badges.length > 0 ? (
                            product.badges.map((badge, idx) => {
                              const isBestseller = badge.toLowerCase().includes('bestseller');
                              return (
                                <span
                                  key={idx}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                    isBestseller
                                      ? 'bg-[#7c5310] text-[#ffdf88] border border-[#d4af37]/50'
                                      : 'bg-[#402366] text-[#d6bbfb] border border-[#8b5cf6]/50'
                                  }`}
                                >
                                  {badge}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[#594d35] text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* 7. ACTIONS (Edit, Duplicate, Delete) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 rounded-lg text-[#8c7a4f] hover:text-[#e5c158] hover:bg-[#201a14] transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate Button */}
                          <button
                            type="button"
                            onClick={() => onDuplicateProduct(product.id)}
                            className="p-1.5 rounded-lg text-[#8c7a4f] hover:text-[#e5c158] hover:bg-[#201a14] transition-colors"
                            title="Duplicate product"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => onDeletePrompt(product)}
                            className="p-1.5 rounded-lg text-[#8c7a4f] hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Delete product"
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
                  <td colSpan={7} className="py-16 px-4 text-center text-[#8c7a4f]">
                    <div className="max-w-md mx-auto flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#1a1611] border border-[#2d251a] flex items-center justify-center mb-3 text-[#e5c158]">
                        <Package className="w-7 h-7" />
                      </div>
                      <p className="font-serif font-bold text-[#f3e7c4] text-base">
                        {searchTerm || selectedCategory !== 'all' || selectedStockFilter !== 'all'
                          ? 'No matching jewellery pieces found'
                          : 'Your jewellery catalog is empty'}
                      </p>
                      <p className="text-xs text-[#8c7a4f] mt-1.5 leading-relaxed">
                        {searchTerm || selectedCategory !== 'all' || selectedStockFilter !== 'all'
                          ? 'Try resetting your search filters or browse other categories.'
                          : 'All sample products have been cleared. Click below to add your manual inventory items with title, SKU, images, and pricing.'}
                      </p>
                      <button
                        type="button"
                        onClick={onOpenAddModal}
                        className="mt-4 px-5 py-2.5 rounded-xl bg-[#e5c158] hover:bg-[#f3cf65] text-[#0c0a09] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#d4af37]/20 transition-all active:scale-[0.98]"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Add Your First Product</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="px-4 py-3 bg-[#16120d] border-t border-[#241e17] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8c7a4f]">
          <div>
            Showing <strong className="text-[#e5c158]">{paginatedProducts.length}</strong> of{' '}
            <strong className="text-[#f3e7c4]">{filteredProducts.length}</strong> products
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-[#1a1611] border border-[#2d251a] text-[#8c7a4f] hover:text-[#e5c158] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-[#d8cca8] font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-[#1a1611] border border-[#2d251a] text-[#8c7a4f] hover:text-[#e5c158] disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
