import React, { useMemo, useState } from 'react';
import { Category, Product, Subcategory } from '../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  Package,
  RefreshCw,
  Database,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';

interface SubcategoriesViewProps {
  subcategories: Subcategory[];
  categories: Category[];
  products: Product[];
  onOpenAddModal: () => void;
  onEditSubcategory: (subcategory: Subcategory) => void;
  onDeletePrompt: (subcategory: Subcategory) => void;
  onToggleActive: (subcategory: Subcategory) => Promise<void>;
  onRefresh?: () => void;
  isLoading?: boolean;
  onOpenSqlSetup?: () => void;
}

const PAGE_SIZE = 10;

export const SubcategoriesView: React.FC<SubcategoriesViewProps> = ({
  subcategories,
  categories,
  products,
  onOpenAddModal,
  onEditSubcategory,
  onDeletePrompt,
  onToggleActive,
  onRefresh,
  isLoading = false,
  onOpenSqlSetup,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [parentFilter, setParentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | number | null>(null);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categories]);

  const productCountBySubcategory = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((product) => {
      if (product.subcategory_id === undefined || product.subcategory_id === null) return;
      const key = String(product.subcategory_id);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    let result = [...subcategories];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter((subcategory) => {
        const parentName = categoryNameById.get(subcategory.category_id) || '';
        return (
          subcategory.name.toLowerCase().includes(query) ||
          subcategory.slug.toLowerCase().includes(query) ||
          parentName.toLowerCase().includes(query)
        );
      });
    }

    if (parentFilter !== 'all') {
      result = result.filter((subcategory) => subcategory.category_id === parentFilter);
    }

    result.sort((a, b) => {
      const orderA = Number(a.sort_order) || 0;
      const orderB = Number(b.sort_order) || 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [subcategories, searchTerm, parentFilter, categoryNameById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const activeCount = subcategories.filter((s) => s.is_active).length;

  const handleToggle = async (subcategory: Subcategory) => {
    setTogglingId(subcategory.id);
    try {
      await onToggleActive(subcategory);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-black bg-[#ffffff] px-5 py-4 shadow-sm">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0f172a] tracking-wide uppercase border-l-4 border-[#d97706] pl-3">
            SUBCATEGORIES
          </h2>
          <p className="text-xs text-[#475569] mt-1">
            Create themed sub-collections under your parent categories — they publish instantly to the storefront.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="px-3.5 py-2.5 rounded-xl bg-[#f8fafc] hover:bg-[#e2e8f0] text-[#a16207] border border-black font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}

          {onOpenSqlSetup && (
            <button
              type="button"
              onClick={onOpenSqlSetup}
              className="px-3.5 py-2.5 rounded-xl bg-[#f8fafc] hover:bg-[#e2e8f0] text-[#a16207] border border-black font-semibold text-xs flex items-center gap-1.5 transition-colors"
              title="View the categories & subcategories Supabase migration"
            >
              <Database className="w-3.5 h-3.5" />
              <span>SQL Setup</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-[#a16207] hover:bg-[#854d0e] text-[#ffffff] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#d97706]/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Subcategory</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#ffffff] border border-black">
          <p className="inline-block px-2 py-0.5 rounded-md bg-[#f8fafc] border border-black text-[10px] uppercase tracking-wider text-[#475569]">Total subcategories</p>
          <p className="text-2xl font-serif font-bold text-[#0f172a] mt-1">{subcategories.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#ffffff] border border-black">
          <p className="inline-block px-2 py-0.5 rounded-md bg-[#f8fafc] border border-black text-[10px] uppercase tracking-wider text-[#475569]">Active on storefront</p>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">{activeCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#ffffff] border border-black">
          <p className="inline-block px-2 py-0.5 rounded-md bg-[#f8fafc] border border-black text-[10px] uppercase tracking-wider text-[#475569]">Parent categories</p>
          <p className="text-2xl font-serif font-bold text-[#a16207] mt-1">{categories.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-black bg-[#ffffff] px-4 py-3 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#475569] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search subcategories or parent categories..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#f8fafc] border border-black text-[#0f172a] placeholder:text-[#64748b] focus:outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706]/30 transition-all"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={parentFilter}
            onChange={(event) => {
              setParentFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#f8fafc] border border-black text-[#a16207] font-medium focus:outline-none focus:border-[#d97706] cursor-pointer"
          >
            <option value="all">All Parent Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#ffffff] rounded-2xl border border-black shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black bg-[#f8fafc] text-[#475569] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-4 px-4 font-semibold">Subcategory</th>
                <th className="py-4 px-3 font-semibold">Parent Category</th>
                <th className="py-4 px-3 font-semibold">Products</th>
                <th className="py-4 px-3 font-semibold">Status</th>
                <th className="py-4 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {paginated.length > 0 ? (
                paginated.map((subcategory) => {
                  const count = productCountBySubcategory.get(String(subcategory.id)) || 0;
                  const parentName =
                    categoryNameById.get(subcategory.category_id) || subcategory.category_id;

                  return (
                    <tr key={subcategory.id} className="odd:bg-[#ffffff] even:bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors group">
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-black bg-[#f1f5f9] shrink-0 flex items-center justify-center">
                            {subcategory.featured_image ? (
                              <img
                                src={subcategory.featured_image}
                                alt={subcategory.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-[#cbd5e1]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-[#0f172a] text-xs truncate max-w-[220px]">
                              {subcategory.name}
                            </h3>
                            <p className="text-[10px] font-mono text-[#475569] mt-0.5 truncate max-w-[220px]">
                              /{subcategory.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium bg-[#f8fafc] text-[#334155] border border-black">
                          <Layers className="w-3 h-3 text-[#475569]" />
                          {parentName}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-[#334155]">
                          <Package className="w-3.5 h-3.5 text-[#475569]" />
                          <strong className="text-[#0f172a]">{count}</strong>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggle(subcategory)}
                          disabled={togglingId === subcategory.id}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors disabled:opacity-50 ${
                            subcategory.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-[#e2e8f0] text-[#475569] border-black hover:text-[#334155]'
                          }`}
                          title="Toggle storefront visibility"
                        >
                          {togglingId === subcategory.id
                            ? 'Saving…'
                            : subcategory.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditSubcategory(subcategory)}
                            className="p-1.5 rounded-lg text-[#475569] hover:text-[#a16207] hover:bg-[#e2e8f0] transition-colors"
                            title="Edit subcategory"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePrompt(subcategory)}
                            className="p-1.5 rounded-lg text-[#475569] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete subcategory"
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
                  <td colSpan={5} className="py-16 px-4 text-center text-[#475569]">
                    <div className="max-w-md mx-auto flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#f1f5f9] border border-black flex items-center justify-center mb-3 text-[#a16207]">
                        <Layers className="w-7 h-7" />
                      </div>
                      <p className="font-serif font-bold text-[#0f172a] text-base">
                        {searchTerm || parentFilter !== 'all'
                          ? 'No matching subcategories'
                          : 'No subcategories yet'}
                      </p>
                      <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
                        {searchTerm || parentFilter !== 'all'
                          ? 'Try a different search term or parent category.'
                          : 'Add your first subcategory to help customers browse your products by collection.'}
                      </p>
                      {!searchTerm && parentFilter === 'all' && (
                        <button
                          type="button"
                          onClick={onOpenAddModal}
                          className="mt-4 px-5 py-2.5 rounded-xl bg-[#a16207] hover:bg-[#854d0e] text-[#ffffff] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#d97706]/20 transition-all active:scale-[0.98]"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>Add Subcategory</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-[#ffffff] border-t border-black flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#475569]">
          <div>
            Showing <strong className="text-[#a16207]">{paginated.length}</strong> of{' '}
            <strong className="text-[#0f172a]">{filtered.length}</strong> subcategories
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg bg-[#f1f5f9] border border-black text-[#475569] hover:text-[#a16207] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-[#334155] font-medium">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg bg-[#f1f5f9] border border-black text-[#475569] hover:text-[#a16207] disabled:opacity-40"
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
