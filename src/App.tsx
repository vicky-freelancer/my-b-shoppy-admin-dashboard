import { requestAdminAuth, isExpiredAdminSession } from './lib/adminAuth';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Order, OrderStatus, AdminUser, AppSettings, OrderStats, Product, ProductStats, NavTab, Category, Subcategory } from './types';
import {
  getOrders,
  updateOrderStatus,
  createOrder,
  deleteOrder,
  deleteMultipleOrders,
  seedSupabaseOrders,
  supabase,
} from './lib/supabase';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  decrementProductStock,
  computeProductStats,
} from './lib/products';
import {
  getCategories,
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  setSubcategoryActive,
  SubcategoryInput,
} from './lib/subcategories';
import { computeStats } from './lib/utils';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { ProductsView } from './components/ProductsView';
import { SubcategoriesView } from './components/SubcategoriesView';
import { SubcategoryModal, SubcategoryFormValues } from './components/SubcategoryModal';
import { DeleteSubcategoryModal } from './components/DeleteSubcategoryModal';
import { ProductModal } from './components/ProductModal';
import { DeleteProductModal } from './components/DeleteProductModal';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { StatsCards } from './components/StatsCards';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { OrdersTable } from './components/OrdersTable';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { NewOrderModal } from './components/NewOrderModal';
import { SettingsModal } from './components/SettingsModal';
import { SupabaseSqlModal } from './components/SupabaseSqlModal';
import { LoginView } from './components/LoginView';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertCircle, RefreshCw, Sparkles, X, Database } from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'mybshoppy_admin_settings_v2';

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'MY B SHOPPY',
  companyName: 'MY B SHOPPY Luxury Collections',
  currencySymbol: '₹',
  supportPhone: '+91 98765 43210',
  supportEmail: 'orders@mybshoppy.com',
  enableSoundAlerts: true,
  autoRefreshInterval: 30,
  defaultFilterStatus: 'all',
};

export default function App() {
  // 1. Navigation state
  const [activeTab, setActiveTab] = useState<NavTab>('products');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // 2. Settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SETTINGS;
  });

  // 3. Auth state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const authGeneration = useRef(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let inFlight = false;
    try { localStorage.removeItem('mybshoppy_admin_user_v2'); } catch { /* Storage may be unavailable. */ }
    const check = async () => {
      if (inFlight) return;
      inFlight = true;
      const generation = authGeneration.current;
      const isCurrent = () => active && generation === authGeneration.current;
      try {
        const result = await requestAdminAuth('session');
        if (isCurrent() && result.user) setAdminUser((current) => current?.id === result.user!.id ? current : result.user!);
      } catch (error) {
        if (isCurrent() && isExpiredAdminSession(error)) {
          setAdminUser(null);
          setMobileMenuOpen(false);
        }
      } finally {
        inFlight = false;
        if (active) setCheckingSession(false);
      }
    };
    check();
    const onFocus = () => { void check(); };
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(check, 60_000);
    return () => { active = false; clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const onChange = () => { if (media.matches) setMobileMenuOpen(false); };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const drawer = document.getElementById('admin-sidebar');
    drawer?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
      if (event.key !== 'Tab') return;
      const buttons = drawer?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]');
      const visible = Array.from(buttons || []).filter((item) => item.getClientRects().length > 0);
      const first = visible[0]; const last = visible[visible.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKey); previousFocus?.focus(); };
  }, [mobileMenuOpen]);

  // 4. Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] = useState(false);

  // 4b. Catalog taxonomy (categories + subcategories)
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isTaxonomyLoading, setIsTaxonomyLoading] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [deletingSubcategory, setDeletingSubcategory] = useState<Subcategory | null>(null);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [isDeleteSubcategoryModalOpen, setIsDeleteSubcategoryModalOpen] = useState(false);

  // 5. Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 6. Modals state
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [sqlModalError, setSqlModalError] = useState<string | null>(null);

  // 7. Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Fetch products
  const loadProducts = useCallback(async () => {
    try {
      const res = await getProducts();
      setProducts(res.products);
    } catch (err: any) {
      console.error('Failed to load products:', err);
    }
  }, []);

  // Fetch categories + subcategories
  const loadTaxonomy = useCallback(async () => {
    setIsTaxonomyLoading(true);
    try {
      const [categoryRes, subcategoryRes] = await Promise.all([getCategories(), getSubcategories()]);
      const allowedCategoryIds = new Set(categoryRes.categories.map((category) => category.id));
      setCategories(categoryRes.categories);
      setSubcategories(
        subcategoryRes.subcategories.filter((subcategory) =>
          allowedCategoryIds.has(subcategory.category_id)
        )
      );
    } catch (err: any) {
      console.error('Failed to load categories/subcategories:', err);
    } finally {
      setIsTaxonomyLoading(false);
    }
  }, []);

  // Fetch orders from Supabase
  const loadOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await getOrders();
      setOrders(res.orders);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      if (!isSilent) showToast('Failed to load latest orders', 'error');
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [showToast]);

  // Initial load
  useEffect(() => {
    if (!adminUser) return;
    loadProducts();
    loadOrders();
    loadTaxonomy();
  }, [adminUser, loadProducts, loadOrders, loadTaxonomy]);

  // Realtime Supabase Subscription & Auto-refresh timer
  useEffect(() => {
    if (!adminUser) return;
    const channel = supabase
      .channel('public:dashboard_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadOrders(true);
          showToast('Live order update received!', 'info');
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          loadProducts();
          showToast('Products catalog updated!', 'info');
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subcategories' },
        () => {
          loadTaxonomy();
          showToast('Subcategories updated!', 'info');
        }
      )
      .subscribe();

    let intervalId: any = null;
    if (settings.autoRefreshInterval > 0) {
      intervalId = setInterval(() => {
        loadOrders(true);
        loadProducts();
        loadTaxonomy();
      }, settings.autoRefreshInterval * 1000);
    }

    return () => {
      supabase.removeChannel(channel);
      if (intervalId) clearInterval(intervalId);
    };
  }, [adminUser, settings.autoRefreshInterval, loadOrders, loadProducts, loadTaxonomy, showToast]);

  // Save settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    showToast('Settings updated successfully.');
  };

  // Auth handlers
  const handleLogin = (user: AdminUser) => {
    authGeneration.current += 1;
    setAdminUser(user);

    showToast(`Welcome back, ${user.name}!`);
  };

  const handleLogout = async () => {
    try {
      await requestAdminAuth('logout');
      authGeneration.current += 1;
      setAdminUser(null);
      setMobileMenuOpen(false);
      setProducts([]); setOrders([]); setCategories([]); setSubcategories([]);
      setIsProductModalOpen(false); setIsNewOrderModalOpen(false); setIsSettingsModalOpen(false);
    } catch { showToast('Unable to sign out. Please try again.', 'error'); }
  };

  // Product CRUD Handlers
  const handleSaveProduct = async (productData: Omit<Product, 'id'>) => {
    if (editingProduct) {
      const res = await updateProduct(editingProduct.id, productData);
      if (res.success) {
        setProducts((current) => current.map((product) =>
          String(product.id) === String(editingProduct.id)
            ? { ...product, ...productData, ...res.product }
            : product
        ));
        showToast(`Product "${productData.title}" updated successfully!`);
      } else {
        await loadProducts();
        if (res.error) {
          setSqlModalError(res.error);
          if (res.isDatabaseError) setIsSqlModalOpen(true);
        }
        showToast(res.error || 'Failed to update product in Supabase', 'error');
      }
    } else {
      const res = await createProduct(productData);
      if (res.success) {
        if (res.product) {
          const createdProduct = res.product;
          setProducts((current) => [createdProduct, ...current.filter((product) => String(product.id) !== String(createdProduct.id))]);
        }
        showToast(`New product "${productData.title}" saved to Supabase!`);
      } else {
        await loadProducts();
        if (res.error) {
          setSqlModalError(res.error);
          if (res.isDatabaseError) setIsSqlModalOpen(true);
        }
        showToast(res.error || 'Failed to add product to Supabase', 'error');
      }
    }
  };

  const handleDuplicateProduct = async (productId: string | number) => {
    const res = await duplicateProduct(productId);
    if (res.success) {
      await loadProducts();
      showToast('Product duplicated successfully!');
    } else {
      showToast(res.error || 'Failed to duplicate product', 'error');
    }
  };

  const handleDeleteProduct = async (productId: string | number) => {
    const res = await deleteProduct(productId);
    if (res.success) {
      await loadProducts();
      showToast('Product removed from catalog.');
    } else {
      showToast(res.error || 'Failed to delete product', 'error');
    }
  };

  // Subcategory CRUD handlers
  const handleSaveSubcategory = async (values: SubcategoryFormValues) => {
    const res = editingSubcategory
      ? await updateSubcategory(editingSubcategory.id, values as SubcategoryInput)
      : await createSubcategory(values as SubcategoryInput);

    if (!res.success) {
      if (res.isDatabaseError) {
        setSqlModalError(res.error || null);
        setIsSqlModalOpen(true);
      }
      showToast(res.error || 'Failed to save subcategory', 'error');
      throw new Error(res.error || 'Failed to save subcategory');
    }

    await loadTaxonomy();
    showToast(
      editingSubcategory
        ? `Subcategory "${values.name}" updated successfully.`
        : `Subcategory "${values.name}" created and published.`
    );
  };

  const handleDeleteSubcategory = async (id: string | number) => {
    const target = subcategories.find((subcategory) => String(subcategory.id) === String(id));
    const res = await deleteSubcategory(id);
    if (!res.success) {
      showToast(res.error || 'Failed to delete subcategory', 'error');
      throw new Error(res.error || 'Failed to delete subcategory');
    }
    setSubcategories((prev) => prev.filter((subcategory) => String(subcategory.id) !== String(id)));
    await loadTaxonomy();
    showToast(`Subcategory "${target?.name || id}" deleted.`);
  };

  const handleToggleSubcategory = async (subcategory: Subcategory) => {
    const nextActive = !subcategory.is_active;
    setSubcategories((prev) =>
      prev.map((item) =>
        String(item.id) === String(subcategory.id) ? { ...item, is_active: nextActive } : item
      )
    );
    const res = await setSubcategoryActive(subcategory.id, nextActive);
    if (!res.success) {
      setSubcategories((prev) =>
        prev.map((item) =>
          String(item.id) === String(subcategory.id)
            ? { ...item, is_active: subcategory.is_active }
            : item
        )
      );
      showToast(res.error || 'Failed to update subcategory status', 'error');
    } else {
      showToast(`"${subcategory.name}" is now ${nextActive ? 'active' : 'inactive'}.`);
    }
  };

  // Order Status update
  const handleUpdateStatus = async (
    orderId: string | number,
    newStatus: OrderStatus,
    extraUpdates?: Partial<Order>
  ) => {
    setOrders((prev) =>
      prev.map((o) => (String(o.id) === String(orderId) ? { ...o, status: newStatus, ...extraUpdates } : o))
    );
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus, ...extraUpdates } : null));
    }

    if (newStatus === 'delivered') {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}
    }

    const res = await updateOrderStatus(orderId, newStatus, extraUpdates);
    if (res.success) {
      showToast(`Order #${orderId} marked as ${newStatus.toUpperCase()}`);
    } else {
      showToast(res.error || 'Failed to sync status', 'error');
    }
  };

  // Create new order
  const handleCreateOrder = async (orderData: Omit<Order, 'id'>) => {
    const res = await createOrder(orderData);
    if (res.success && res.order) {
      setOrders((prev) => [res.order!, ...prev]);
      if (orderData.product_id) {
        // Reduce the product's available stock so the storefront reflects it
        const stockRes = await decrementProductStock(orderData.product_id, orderData.quantity || 1);
        await loadProducts();
        if (stockRes.success) {
          showToast(`Order #${res.order.id} created — stock reduced for "${orderData.product_variant}"`);
        } else {
          showToast(
            `Order #${res.order.id} created, but stock was not reduced: ${stockRes.error || 'unknown error'}`,
            'error'
          );
        }
      } else {
        showToast(`Order #${res.order.id} created successfully!`);
      }
    } else {
      showToast(res.error || 'Failed to create order', 'error');
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId: string | number) => {
    setOrders((prev) => prev.filter((o) => String(o.id) !== String(orderId)));
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder(null);
    }
    const res = await deleteOrder(orderId);
    if (res.success) {
      showToast(`Order #${orderId} permanently deleted.`);
    } else {
      showToast(res.error || 'Failed to delete order', 'error');
    }
  };

  // Bulk delete orders
  const handleDeleteBulkOrders = async (orderIds: (string | number)[]) => {
    const idSet = new Set(orderIds.map((id) => String(id)));
    setOrders((prev) => prev.filter((o) => !idSet.has(String(o.id))));
    if (selectedOrder && idSet.has(String(selectedOrder.id))) {
      setSelectedOrder(null);
    }
    const res = await deleteMultipleOrders(orderIds);
    if (res.success) {
      showToast(`Successfully deleted ${res.deletedCount} orders.`);
    } else {
      showToast(res.error || 'Failed to delete some orders', 'error');
    }
  };

  // Seed data
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await seedSupabaseOrders();
      if (res.success) {
        await loadOrders();
        showToast(`Seeded ${res.count} sample orders!`);
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Seeding error', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Statistics
  const orderStats: OrderStats = useMemo(() => computeStats(orders, products), [orders, products]);
  const productStats: ProductStats = useMemo(() => computeProductStats(products), [products]);

  if (checkingSession) return <div role="status" className="min-h-dvh flex items-center justify-center p-6">Checking session...</div>;
  if (!adminUser) {
    return <LoginView onLoginSuccess={handleLogin} settings={settings} />;
  }

  return (
    <div className="min-h-dvh bg-[#f1f5f9] text-[#1e293b] font-sans flex antialiased selection:bg-[#a16207] selection:text-[#ffffff]">
      {/* Toast Notification */}
      {toast && (
        <div
          id="toast-banner"
          className="fixed top-4 right-4 left-4 sm:left-auto z-[70] max-w-md bg-[#ffffff] text-[#0f172a] px-4 py-3 rounded-2xl shadow-2xl border border-[#d97706]/40 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-3 duration-200"
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#a16207] shrink-0" />
          )}
          <span className="flex-1 font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[#475569] hover:text-[#0f172a] p-0.5 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Left Sidebar */}
      {mobileMenuOpen && <button type="button" aria-label="Close navigation backdrop" className="fixed inset-0 bg-black/45 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }}
        adminUser={adminUser}
        onOpenSettings={() => { setIsSettingsModalOpen(true); setMobileMenuOpen(false); }}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed && !mobileMenuOpen}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        ordersCount={orders.length}
        productsCount={products.length}
        subcategoriesCount={subcategories.length}
      />

      {/* Main Content Pane */}
      <div inert={mobileMenuOpen} className="flex-1 flex flex-col min-w-0 bg-[#f1f5f9]">
        {/* Top Header */}
        <TopHeader
          onOpenMenu={() => setMobileMenuOpen(true)}
          settings={settings}
          adminUser={adminUser}
          onOpenSettings={() => { setIsSettingsModalOpen(true); setMobileMenuOpen(false); }}
          onOpenNewProduct={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
          onOpenSqlSetup={() => setIsSqlModalOpen(true)}
          onRefresh={() => {
            loadProducts();
            loadOrders();
          }}
          isLoading={isLoading}
          globalSearch={globalSearch}
          onGlobalSearchChange={setGlobalSearch}
        />

        {/* View Switcher */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Tab 1: Products View (Primary Reference Request) */}
          {activeTab === 'products' && (
            <ProductsView
              products={products}
              onOpenAddModal={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onEditProduct={(p) => {
                setEditingProduct(p);
                setIsProductModalOpen(true);
              }}
              onDuplicateProduct={handleDuplicateProduct}
              onDeletePrompt={(p) => {
                setDeletingProduct(p);
                setIsDeleteProductModalOpen(true);
              }}
              currencySymbol={settings.currencySymbol}
              isLoading={isLoading}
              onOpenSqlSetup={() => setIsSqlModalOpen(true)}
            />
          )}

          {/* Tab 1b: Subcategories View */}
          {activeTab === 'subcategories' && (
            <SubcategoriesView
              subcategories={subcategories}
              categories={categories}
              products={products}
              onOpenAddModal={() => {
                setEditingSubcategory(null);
                setIsSubcategoryModalOpen(true);
              }}
              onEditSubcategory={(subcategory) => {
                setEditingSubcategory(subcategory);
                setIsSubcategoryModalOpen(true);
              }}
              onDeletePrompt={(subcategory) => {
                setDeletingSubcategory(subcategory);
                setIsDeleteSubcategoryModalOpen(true);
              }}
              onToggleActive={handleToggleSubcategory}
              onRefresh={loadTaxonomy}
              isLoading={isTaxonomyLoading}
              onOpenSqlSetup={() => setIsSqlModalOpen(true)}
            />
          )}

          {/* Tab 2: Dashboard View */}
          {activeTab === 'dashboard' && (
            <DashboardView
              products={products}
              orders={orders}
              productStats={productStats}
              orderStats={orderStats}
              currencySymbol={settings.currencySymbol}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenNewProduct={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
            />
          )}

          {/* Tab 3: Orders View */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-black bg-[#ffffff] px-5 py-4 shadow-sm">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#0f172a] tracking-wide uppercase border-l-4 border-[#d97706] pl-3">
                    COD ORDERS DISPATCH
                  </h2>
                  <p className="text-xs text-[#475569] mt-1">
                    Manage customer orders, addresses, and delivery status tracking.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSqlModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl border border-black bg-[#ffffff] hover:bg-[#f8fafc] text-[#a16207] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="View and copy Supabase SQL Schema for Orders & Products"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>SQL Schema</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    className="px-3.5 py-2 rounded-xl border border-black bg-[#ffffff] hover:bg-[#f8fafc] text-[#a16207] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSeeding ? 'Seeding...' : 'Seed Orders'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsNewOrderModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#a16207] hover:bg-[#854d0e] text-[#ffffff] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#d97706]/20 transition-all active:scale-[0.98]"
                  >
                    <span>+ New Order</span>
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <StatsCards
                stats={orderStats}
                currencySymbol={settings.currencySymbol}
                activeStatusFilter={activeStatusFilter}
                onSelectStatusFilter={(status) => setActiveStatusFilter(status)}
              />

              {/* Orders Table */}
              <OrdersTable
                orders={orders}
                products={products}
                onSelectOrder={(order) => setSelectedOrder(order)}
                onUpdateStatus={handleUpdateStatus}
                onDeleteOrder={handleDeleteOrder}
                onDeleteBulkOrders={handleDeleteBulkOrders}
                onOpenNewOrderModal={() => setIsNewOrderModalOpen(true)}
                currencySymbol={settings.currencySymbol}
                onRefresh={() => loadOrders()}
                isLoading={isLoading}
                appName={settings.appName}
                activeStatusFilter={activeStatusFilter}
                onChangeStatusFilter={(st) => setActiveStatusFilter(st)}
              />
            </div>
          )}

          {/* Tab 4: Customers View */}
          {activeTab === 'customers' && (
            <CustomersView orders={orders} products={products} currencySymbol={settings.currencySymbol} />
          )}

          {/* Tab 5: Analytics View */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-black bg-[#ffffff] px-5 py-4 shadow-sm">
                <h2 className="text-2xl font-serif font-bold text-[#0f172a] tracking-wide uppercase border-l-4 border-[#d97706] pl-3">
                  SALES & INVENTORY ANALYTICS
                </h2>
                <p className="text-xs text-[#475569] mt-1">
                  Revenue breakdown, category performance, and delivery metrics.
                </p>
              </div>
              <AnalyticsPanel stats={orderStats} currencySymbol={settings.currencySymbol} />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-black bg-[#ffffff] py-4 text-center text-xs text-[#475569] mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-serif text-[#334155]">
              {settings.appName} &bull; {settings.companyName}
            </span>
            <span className="flex items-center gap-2 text-[#475569]">
              <span className="w-2 h-2 rounded-full bg-[#a16207]" />
              Supabase Catalog & Order Live Sync Enabled
            </span>
          </div>
        </footer>
      </div>

      {/* Product Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSaveProduct}
        editingProduct={editingProduct}
        currencySymbol={settings.currencySymbol}
        onOpenSqlSetup={() => setIsSqlModalOpen(true)}
        categories={categories}
        subcategories={subcategories}
      />

      <DeleteProductModal
        isOpen={isDeleteProductModalOpen}
        product={deletingProduct}
        onClose={() => {
          setIsDeleteProductModalOpen(false);
          setDeletingProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        currencySymbol={settings.currencySymbol}
      />

      <SubcategoryModal
        isOpen={isSubcategoryModalOpen}
        onClose={() => {
          setIsSubcategoryModalOpen(false);
          setEditingSubcategory(null);
        }}
        onSubmit={handleSaveSubcategory}
        categories={categories}
        editingSubcategory={editingSubcategory}
        onOpenSqlSetup={() => setIsSqlModalOpen(true)}
      />

      <DeleteSubcategoryModal
        isOpen={isDeleteSubcategoryModalOpen}
        subcategory={deletingSubcategory}
        productCount={
          deletingSubcategory
            ? products.filter(
                (product) => String(product.subcategory_id) === String(deletingSubcategory.id)
              ).length
            : 0
        }
        onClose={() => {
          setIsDeleteSubcategoryModalOpen(false);
          setDeletingSubcategory(null);
        }}
        onConfirm={handleDeleteSubcategory}
      />

      {/* Order Modals */}
      <OrderDetailsModal
        order={selectedOrder}
        products={products}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        onDeleteOrder={handleDeleteOrder}
        currencySymbol={settings.currencySymbol}
        supportPhone={settings.supportPhone}
        appName={settings.appName}
      />

      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onSubmit={handleCreateOrder}
        currencySymbol={settings.currencySymbol}
        products={products}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
        onOpenSqlSetup={() => setIsSqlModalOpen(true)}
      />

      {/* Supabase Schema & SQL Setup Helper Modal */}
      <SupabaseSqlModal
        isOpen={isSqlModalOpen}
        onClose={() => {
          setIsSqlModalOpen(false);
          setSqlModalError(null);
        }}
        initialError={sqlModalError}
      />
    </div>
  );
}

