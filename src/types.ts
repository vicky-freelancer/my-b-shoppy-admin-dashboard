export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type NavTab = 'dashboard' | 'products' | 'orders' | 'customers' | 'analytics';

export interface Product {
  id: string | number;
  title: string;
  sku: string;
  category: string;
  cover_image: string;
  mrp: number;
  sale_price: number;
  quantity: number;
  badges: string[]; // e.g. ['Bestseller', 'Featured', 'New Arrival']
  description?: string;
  material?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string | number;
  customer_name: string;
  email?: string | null;
  phone: string;
  city: string;
  address: string;
  category?: string;
  product_variant: string;
  product_id?: string | number;
  quantity: number;
  status: OrderStatus | string;
  created_at: string;
  amount?: number;
  price?: number;
  sale_price?: number;
  price_per_unit?: number;
  mrp?: number;
  notes?: string;
  tracking_number?: string;
  payment_method?: string;
}

export interface ProductStats {
  totalProducts: number;
  totalInventoryUnits: number;
  totalCatalogValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoriesCount: number;
  bestsellersCount: number;
}

export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number;
  totalRevenue: number;
  collectedRevenue: number;
  deliverySuccessRate: number;
  topCities: { city: string; count: number }[];
  topProducts: { product: string; count: number }[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'Super Admin' | 'Logistics Manager' | 'Support Agent';
  avatarUrl?: string;
}

export interface AppSettings {
  appName: string;
  companyName: string;
  currencySymbol: string;
  supportPhone: string;
  supportEmail: string;
  enableSoundAlerts: boolean;
  autoRefreshInterval: number; // in seconds (0 for disabled)
  defaultFilterStatus: string;
}

export interface FilterState {
  search: string;
  status: string;
  city: string;
  dateRange: 'all' | 'today' | '7days' | '30days' | 'this_month';
  sortBy: 'created_at' | 'customer_name' | 'quantity' | 'status' | 'city';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
