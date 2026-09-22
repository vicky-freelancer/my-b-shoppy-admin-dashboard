import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Order, OrderStatus, AdminUser, AppSettings, OrderStats, Product, ProductStats, NavTab } from './types';
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
  computeProductStats,
} from './lib/products';
import { computeStats } from './lib/utils';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { ProductsView } from './components/ProductsView';
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
const USER_STORAGE_KEY = 'mybshoppy_admin_user_v2';

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

const DEFAULT_ADMIN: AdminUser = {
  id: 'admin_super_1',
  name: 'Admin',
  email: 'admin@mybshoppy.com',
  role: 'Super Admin',
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
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ADMIN;
  });

  // 4. Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] = useState(false);

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
    loadProducts();
    loadOrders();
  }, [loadProducts, loadOrders]);

  // Realtime Supabase Subscription & Auto-refresh timer
  useEffect(() => {
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
      .subscribe();

    let intervalId: any = null;
    if (settings.autoRefreshInterval > 0) {
      intervalId = setInterval(() => {
        loadOrders(true);
        loadProducts();
      }, settings.autoRefreshInterval * 1000);
    }

    return () => {
      supabase.removeChannel(channel);
      if (intervalId) clearInterval(intervalId);
    };
  }, [settings.autoRefreshInterval, loadOrders, loadProducts, showToast]);

  // Save settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    showToast('Settings updated successfully.');
  };

  // Auth handlers
  const handleLogin = (user: AdminUser) => {
    setAdminUser(user);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    showToast(`Welcome back, ${user.name}!`);
  };

  const handleLogout = () => {
    setAdminUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    showToast('Logged out of admin session.', 'info');
  };

  // Product CRUD Handlers
  const handleSaveProduct = async (productData: Omit<Product, 'id'>) => {
    if (editingProduct) {
      const res = await updateProduct(editingProduct.id, productData);
      if (res.success) {
        await loadProducts();
        showToast(`Product "${productData.title}" updated successfully!`);
      } else {
        await loadProducts();
        if (res.error) {
          setSqlModalError(res.error);
        }
        showToast(res.error || 'Failed to update product in Supabase', 'error');
      }
    } else {
      const res = await createProduct(productData);
      if (res.success) {
        await loadProducts();
        showToast(`New product "${productData.title}" saved to Supabase!`);
      } else {
        await loadProducts();
        if (res.error) {
          setSqlModalError(res.error);
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
      showToast(`Order #${res.order.id} created successfully!`);
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

  if (!adminUser) {
    return <LoginView onLoginSuccess={handleLogin} settings={settings} />;
  }

  return (
    <div className="min-h-screen bg-[#080706] text-[#e8ded1] font-sans flex antialiased selection:bg-[#e5c158] selection:text-[#0c0a09]">
      {/* Toast Notification */}
      {toast && (
        <div
          id="toast-banner"
          className="fixed top-4 right-4 z-50 max-w-md bg-[#16120d] text-[#f3e7c4] px-4 py-3 rounded-2xl shadow-2xl border border-[#d4af37]/40 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-3 duration-200"
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#e5c158] shrink-0" />
          )}
          <span className="flex-1 font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[#8c7a4f] hover:text-[#f3e7c4] p-0.5 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        adminUser={adminUser}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        ordersCount={orders.length}
        productsCount={products.length}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#080706] overflow-x-hidden">
        {/* Top Header */}
        <TopHeader
          settings={settings}
          adminUser={adminUser}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#f3e7c4] tracking-wide uppercase">
                    COD ORDERS DISPATCH
                  </h2>
                  <p className="text-xs text-[#8c7a4f] mt-1">
                    Manage customer orders, addresses, and delivery status tracking.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSqlModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl border border-[#382d20] bg-[#16120d] hover:bg-[#1f1911] text-[#e5c158] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="View and copy Supabase SQL Schema for Orders & Products"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>SQL Schema</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    className="px-3.5 py-2 rounded-xl border border-[#2d251a] bg-[#16120d] hover:bg-[#1f1911] text-[#e5c158] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSeeding ? 'Seeding...' : 'Seed Orders'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsNewOrderModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#e5c158] hover:bg-[#f3cf65] text-[#0c0a09] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#d4af37]/20 transition-all active:scale-[0.98]"
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
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#f3e7c4] tracking-wide uppercase">
                  SALES & INVENTORY ANALYTICS
                </h2>
                <p className="text-xs text-[#8c7a4f] mt-1">
                  Revenue breakdown, category performance, and delivery metrics.
                </p>
              </div>
              <AnalyticsPanel stats={orderStats} currencySymbol={settings.currencySymbol} />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#1f1a14] bg-[#0c0a09] py-4 text-center text-xs text-[#8c7a4f] mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-serif text-[#d8cca8]">
              {settings.appName} &bull; {settings.companyName}
            </span>
            <span className="flex items-center gap-2 text-[#a39882]">
              <span className="w-2 h-2 rounded-full bg-[#e5c158]" />
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

