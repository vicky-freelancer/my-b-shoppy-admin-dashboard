import { createClient } from '@supabase/supabase-js';
import { Order, OrderStatus } from '../types';

export const SUPABASE_URL =
  ((import.meta as any).env?.VITE_SUPABASE_URL as string) ||
  'https://sdgpuyzwygyaxbmxikrp.supabase.co';

export const SUPABASE_ANON_KEY =
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
  'sb_publishable_KzzkyPT3-dX7a74Fl-iwfg_miajjdsS';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init),
  },
});

// Seed data template in case table is empty or for demo testing
export const INITIAL_SAMPLE_ORDERS: Omit<Order, 'id'>[] = [
  {
    customer_name: 'Sophia Laurent',
    email: 'sophia.laurent@example.com',
    phone: '+1 (555) 234-8901',
    city: 'New York',
    address: '742 Evergreen Terrace, Apt 4B',
    category: 'Fashion & Apparel',
    product_variant: 'Midnight Leather Tote - Olive Green',
    quantity: 1,
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    amount: 145,
    notes: 'Please call before delivery. Building code #8821',
  },
  {
    customer_name: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    phone: '+1 (555) 872-1144',
    city: 'San Francisco',
    address: '1048 Market St, Suite 300',
    category: 'Smart Wearables',
    product_variant: 'Titanium Smart Ring - Size 10 / Space Gray',
    quantity: 2,
    status: 'confirmed',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    amount: 299,
    tracking_number: 'TRK-984021-SF',
    notes: 'Customer verified order via WhatsApp call.',
  },
  {
    customer_name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    phone: '+1 (555) 619-3382',
    city: 'Chicago',
    address: '520 N Michigan Ave, 12th Floor',
    category: 'Electronics & Audio',
    product_variant: 'AirPods Pro Max Case - Matte Midnight',
    quantity: 1,
    status: 'shipped',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    amount: 89,
    tracking_number: 'DHL-552910-US',
  },
  {
    customer_name: 'Tariq Al-Mansoor',
    email: 'tariq.mansoor@example.com',
    phone: '+1 (555) 902-7711',
    city: 'Los Angeles',
    address: '8840 Wilshire Blvd, Unit 9',
    category: 'Home & Kitchen',
    product_variant: 'Ceramic Pour-Over Coffee Kit - Sandstone',
    quantity: 3,
    status: 'delivered',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    amount: 240,
    tracking_number: 'FEDEX-771249-LA',
    notes: 'Cash collected by courier: $240.00 exact change.',
  },
  {
    customer_name: 'Chloe Bennett',
    email: 'chloe.b@example.com',
    phone: '+1 (555) 438-9920',
    city: 'Austin',
    address: '2100 S Congress Ave, #104',
    category: 'Office & Workspace',
    product_variant: 'Ergonomic Desk Mat - Wool Felt XL',
    quantity: 1,
    status: 'delivered',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    amount: 68,
    tracking_number: 'UPS-339180-AT',
  },
  {
    customer_name: 'David Chen',
    email: 'david.chen@example.com',
    phone: '+1 (555) 312-7654',
    city: 'Seattle',
    address: '1400 4th Ave, Penthouse C',
    category: 'Electronics & Audio',
    product_variant: 'Wireless Noise-Canceling Headphones - Silver',
    quantity: 1,
    status: 'cancelled',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    amount: 220,
    notes: 'Customer changed mind before dispatch.',
  },
  {
    customer_name: 'Amara Okafor',
    email: 'amara.okafor@example.com',
    phone: '+1 (555) 749-0193',
    city: 'Miami',
    address: '350 Ocean Drive, Suite 5A',
    category: 'Computer Accessories',
    product_variant: 'Minimalist Mechanical Keyboard - Walnut Wood',
    quantity: 1,
    status: 'confirmed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    amount: 175,
    tracking_number: 'TRK-661092-MIA',
  },
  {
    customer_name: 'Liam O\'Connor',
    email: 'liam.oc@example.com',
    phone: '+1 (555) 881-2299',
    city: 'Boston',
    address: '88 Beacon St, Apt 2',
    category: 'Fitness & Outdoors',
    product_variant: 'Aerodynamic Aluminum Water Bottle - Stealth Black',
    quantity: 2,
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    amount: 70,
  },
  {
    customer_name: 'Fatima Zahra',
    email: 'fatima.z@example.com',
    phone: '+1 (555) 120-8833',
    city: 'New York',
    address: '45 Wall St, Apt 18B',
    category: 'Home & Living',
    product_variant: 'Organic Linen Bedding Set - Natural Sand (Queen)',
    quantity: 1,
    status: 'shipped',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    amount: 210,
    tracking_number: 'USPS-920183-NY',
  },
  {
    customer_name: 'Lucas Silva',
    email: 'lucas.silva@example.com',
    phone: '+1 (555) 603-9124',
    city: 'San Francisco',
    address: '220 Montgomery St, #800',
    category: 'Mobile Accessories',
    product_variant: 'Magnetic MagSafe Stand - Solid Aluminum',
    quantity: 2,
    status: 'delivered',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    amount: 118,
    tracking_number: 'FEDEX-118290-SF',
  }
];

// Local storage key for fallback when offline or working with local changes
const LOCAL_STORAGE_ORDERS_KEY = 'cod_dashboard_orders_cache_v1';

export function getCachedOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading local cache', e);
  }
  return [];
}

export function saveCachedOrders(orders: Order[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed caching orders', e);
  }
}

/**
 * Fetch all orders from Supabase table 'orders'
 */
export async function getOrders(): Promise<{ orders: Order[]; error?: string; source: 'supabase' | 'cache' }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase query error (will fallback to cache):', error.message);
      const cached = getCachedOrders();
      return { orders: cached, error: error.message, source: 'cache' };
    }

    if (data && data.length > 0) {
      const normalizedOrders: Order[] = data.map((item) => {
        const qty = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || 1;
        const unitPrice =
          typeof item.price_per_unit === 'number'
            ? item.price_per_unit
            : typeof item.sale_price === 'number'
            ? item.sale_price
            : typeof item.price === 'number'
            ? item.price
            : item.amount
            ? Number(item.amount) / Math.max(1, qty)
            : 149;

        const totalAmount =
          typeof item.amount === 'number'
            ? item.amount
            : item.amount
            ? Number(item.amount)
            : typeof item.cod_amount === 'number'
            ? item.cod_amount
            : qty * unitPrice;

        return {
          id: item.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          customer_name: item.customer_name || 'Anonymous Customer',
          email: item.email || null,
          phone: item.phone || '',
          city: item.city || 'Unspecified',
          address: item.address || '',
          category: item.category || 'General',
          product_variant: item.product_variant || item.product_name || item.title || 'Standard Product',
          product_id: item.product_id,
          quantity: qty,
          status: (item.status ? String(item.status).toLowerCase() : 'pending') as OrderStatus,
          created_at: item.created_at || new Date().toISOString(),
          amount: totalAmount,
          price: unitPrice,
          sale_price: unitPrice,
          price_per_unit: unitPrice,
          mrp: typeof item.mrp === 'number' ? item.mrp : Number(item.mrp) || 0,
          payment_method: item.payment_method || 'Cash on Delivery (COD)',
          notes: item.notes || '',
          tracking_number: item.tracking_number || '',
        };
      });
      saveCachedOrders(normalizedOrders);
      return { orders: normalizedOrders, source: 'supabase' };
    }

    // If Supabase returned an empty array, return whatever is cached (may be empty)
    const cached = getCachedOrders();
    return { orders: cached, source: 'cache' };
  } catch (err: any) {
    console.error('Fetch orders network exception:', err);
    const cached = getCachedOrders();
    return { orders: cached, error: err.message || 'Network error', source: 'cache' };
  }
}

/**
 * Seed sample data into Supabase if desired
 */
export async function seedSupabaseOrders(): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const recordsToInsert = INITIAL_SAMPLE_ORDERS.map((o) => ({
      customer_name: o.customer_name,
      email: o.email,
      phone: o.phone,
      city: o.city,
      address: o.address,
      category: o.category || 'General',
      product_variant: o.product_variant,
      quantity: o.quantity,
      price: o.price_per_unit || (o.amount && o.quantity ? o.amount / o.quantity : 149),
      sale_price: o.price_per_unit || (o.amount && o.quantity ? o.amount / o.quantity : 149),
      price_per_unit: o.price_per_unit || (o.amount && o.quantity ? o.amount / o.quantity : 149),
      amount: o.amount || (o.quantity ? o.quantity * 149 : 149),
      cod_amount: o.amount || (o.quantity ? o.quantity * 149 : 149),
      status: o.status,
      tracking_number: o.tracking_number || null,
      notes: o.notes || '',
      payment_method: 'Cash on Delivery (COD)',
      created_at: o.created_at,
    }));

    const { data, error } = await supabase
      .from('orders')
      .insert(recordsToInsert)
      .select();

    if (error) {
      throw error;
    }

    return {
      success: true,
      count: data ? data.length : recordsToInsert.length,
      message: 'Successfully seeded sample COD orders to Supabase.',
    };
  } catch (err: any) {
    console.error('Seed orders failed:', err);
    return {
      success: false,
      count: 0,
      message: err.message || 'Failed to seed sample orders.',
    };
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string | number,
  newStatus: OrderStatus | string,
  extraUpdates?: Partial<Order>
): Promise<{ success: boolean; error?: string }> {
  try {
    let dbError: any = null;

    // Skip the Supabase write for locally-generated ids that don't exist in the DB
    if (isDatabaseOrderId(orderId)) {
      const payload: any = {
        status: newStatus,
        ...(extraUpdates || {}),
      };

      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', orderId);
      dbError = error;
    }

    // 2. Also update local cache for instant UI response
    const cached = getCachedOrders();
    const updated = cached.map((o) => {
      if (String(o.id) === String(orderId)) {
        return { ...o, status: newStatus, ...extraUpdates };
      }
      return o;
    });
    saveCachedOrders(updated);

    if (dbError) {
      console.warn('Supabase update returned warning/error (local cache updated):', dbError.message);
      return { success: true, error: dbError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error updating order status:', err);
    // Still update local cache so admin workflow isn't blocked
    const cached = getCachedOrders();
    const updated = cached.map((o) => {
      if (String(o.id) === String(orderId)) {
        return { ...o, status: newStatus, ...extraUpdates };
      }
      return o;
    });
    saveCachedOrders(updated);
    return { success: true, error: err.message };
  }
}

/**
 * Create a new order in Supabase
 */
export async function createOrder(
  orderData: Omit<Order, 'id'>
): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const qty = typeof orderData.quantity === 'number' ? orderData.quantity : Number(orderData.quantity) || 1;
    const unitPrice =
      typeof orderData.price_per_unit === 'number'
        ? orderData.price_per_unit
        : typeof orderData.sale_price === 'number'
        ? orderData.sale_price
        : typeof orderData.price === 'number'
        ? orderData.price
        : orderData.amount
        ? Number(orderData.amount) / Math.max(1, qty)
        : 149;

    const totalAmt =
      typeof orderData.amount === 'number'
        ? orderData.amount
        : orderData.amount
        ? Number(orderData.amount)
        : qty * unitPrice;

    const newRecord = {
      customer_name: orderData.customer_name,
      email: orderData.email || null,
      phone: orderData.phone,
      city: orderData.city,
      address: orderData.address,
      category: orderData.category || 'General',
      product_variant: orderData.product_variant,
      product_id: orderData.product_id || null,
      quantity: qty,
      price: unitPrice,
      sale_price: unitPrice,
      price_per_unit: unitPrice,
      mrp: orderData.mrp || 0,
      amount: totalAmt,
      cod_amount: totalAmt,
      status: orderData.status || 'pending',
      payment_method: orderData.payment_method || 'Cash on Delivery (COD)',
      tracking_number: orderData.tracking_number || null,
      notes: orderData.notes || '',
      created_at: orderData.created_at || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([newRecord])
      .select()
      .single();

    const createdOrder: Order = data
      ? {
          ...data,
          amount: totalAmt,
          price: unitPrice,
          sale_price: unitPrice,
          price_per_unit: unitPrice,
          mrp: orderData.mrp || 0,
          notes: orderData.notes || '',
          tracking_number: orderData.tracking_number || '',
          payment_method: orderData.payment_method || 'Cash on Delivery (COD)',
        }
      : {
          ...orderData,
          amount: totalAmt,
          price: unitPrice,
          sale_price: unitPrice,
          price_per_unit: unitPrice,
          id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        };

    // Update local cache
    const cached = getCachedOrders();
    saveCachedOrders([createdOrder, ...cached]);

    if (error) {
      console.warn('Supabase insert warning:', error.message);
      return { success: true, order: createdOrder, error: error.message };
    }

    return { success: true, order: createdOrder };
  } catch (err: any) {
    console.error('Error creating order:', err);
    const fallbackOrder: Order = {
      ...orderData,
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    const cached = getCachedOrders();
    saveCachedOrders([fallbackOrder, ...cached]);
    return { success: true, order: fallbackOrder, error: err.message };
  }
}

/**
 * Whether an order id is a valid database primary key (integer or UUID).
 * Locally-generated ids like "ORD-1000" never exist in Supabase and would
 * otherwise trigger "invalid input syntax for type uuid" 400 errors.
 */
function isDatabaseOrderId(id: string | number | undefined | null): boolean {
  const s = String(id);
  if (/^\d+$/.test(s)) return true;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

/**
 * Delete a single order from Supabase & local cache
 */
export async function deleteOrder(orderId: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    let dbError: any = null;
    if (isDatabaseOrderId(orderId)) {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      dbError = error;
    }

    const cached = getCachedOrders();
    const filtered = cached.filter((o) => String(o.id) !== String(orderId));
    saveCachedOrders(filtered);

    if (dbError) {
      console.warn('Supabase deleteOrder warning (local cache was updated):', dbError.message);
      return { success: true, error: dbError.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting order:', err);
    const cached = getCachedOrders();
    const filtered = cached.filter((o) => String(o.id) !== String(orderId));
    saveCachedOrders(filtered);
    return { success: true, error: err.message };
  }
}

/**
 * Delete multiple orders in batch from Supabase & local cache
 */
export async function deleteMultipleOrders(
  orderIds: (string | number)[]
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  if (!orderIds || orderIds.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  const idSet = new Set(orderIds.map((id) => String(id)));

  try {
    const dbIds = orderIds.filter(isDatabaseOrderId);

    let dbError: any = null;
    if (dbIds.length > 0) {
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', dbIds);
      dbError = error;
    }

    const cached = getCachedOrders();
    const filtered = cached.filter((o) => !idSet.has(String(o.id)));
    saveCachedOrders(filtered);

    if (dbError) {
      console.warn('Supabase deleteMultipleOrders warning (local cache updated):', dbError.message);
      return { success: true, deletedCount: orderIds.length, error: dbError.message };
    }

    return { success: true, deletedCount: orderIds.length };
  } catch (err: any) {
    console.error('Error batch deleting orders:', err);
    const cached = getCachedOrders();
    const filtered = cached.filter((o) => !idSet.has(String(o.id)));
    saveCachedOrders(filtered);
    return { success: true, deletedCount: orderIds.length, error: err.message };
  }
}
