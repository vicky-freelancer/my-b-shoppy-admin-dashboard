import React, { useState } from 'react';
import { Database, Copy, Check, X, ExternalLink, ShieldCheck, Terminal, AlertCircle, ShoppingBag, Package, Layers } from 'lucide-react';
import { SUPABASE_UNIFIED_SCHEMA_SQL } from '../lib/products';
import { SUPABASE_URL } from '../lib/supabase';

interface SupabaseSqlModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialError?: string | null;
  defaultTab?: 'unified' | 'orders' | 'products';
}

const ORDERS_ONLY_SQL = `-- ==============================================================================
-- MY B SHOPPY - COD ORDERS TABLE SCHEMA (WITH FULL PRICE & STATUS COLUMNS)
-- Run this in your Supabase SQL Editor to enable full orders & price persistence:
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT ('ORD-' || floor(random() * 90000 + 10000)::text),
  customer_name TEXT NOT NULL DEFAULT 'Customer',
  email TEXT,
  phone TEXT NOT NULL DEFAULT '',
  city TEXT DEFAULT 'Unspecified',
  address TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'General',
  product_variant TEXT NOT NULL DEFAULT 'Standard Product',
  product_id BIGINT,
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Matching Price Columns with Products schema
  price NUMERIC DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  price_per_unit NUMERIC DEFAULT 0,
  mrp NUMERIC DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0, -- Total Order & COD price
  cod_amount NUMERIC DEFAULT 0,
  
  -- Order Logistics & Status
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT DEFAULT 'Cash on Delivery (COD)',
  tracking_number TEXT,
  notes TEXT,
  -- Shared storefront-compatible columns (my B shoppy frontend online payment)
  country TEXT DEFAULT '',
  product_name TEXT,
  total_amount NUMERIC DEFAULT 0,
  items_summary TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all order columns exist safely (idempotent migration)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_name') THEN
    ALTER TABLE public.orders ADD COLUMN customer_name TEXT DEFAULT 'Customer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='email') THEN
    ALTER TABLE public.orders ADD COLUMN email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='phone') THEN
    ALTER TABLE public.orders ADD COLUMN phone TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='city') THEN
    ALTER TABLE public.orders ADD COLUMN city TEXT DEFAULT 'Unspecified';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='address') THEN
    ALTER TABLE public.orders ADD COLUMN address TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='category') THEN
    ALTER TABLE public.orders ADD COLUMN category TEXT DEFAULT 'General';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='product_variant') THEN
    ALTER TABLE public.orders ADD COLUMN product_variant TEXT DEFAULT 'Standard Product';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='product_id') THEN
    ALTER TABLE public.orders ADD COLUMN product_id BIGINT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='quantity') THEN
    ALTER TABLE public.orders ADD COLUMN quantity INTEGER DEFAULT 1;
  END IF;
  
  -- Price columns in orders table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='price') THEN
    ALTER TABLE public.orders ADD COLUMN price NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='sale_price') THEN
    ALTER TABLE public.orders ADD COLUMN sale_price NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='price_per_unit') THEN
    ALTER TABLE public.orders ADD COLUMN price_per_unit NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='mrp') THEN
    ALTER TABLE public.orders ADD COLUMN mrp NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='amount') THEN
    ALTER TABLE public.orders ADD COLUMN amount NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='cod_amount') THEN
    ALTER TABLE public.orders ADD COLUMN cod_amount NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='status') THEN
    ALTER TABLE public.orders ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT DEFAULT 'Cash on Delivery (COD)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking_number') THEN
    ALTER TABLE public.orders ADD COLUMN tracking_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='notes') THEN
    ALTER TABLE public.orders ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='country') THEN
    ALTER TABLE public.orders ADD COLUMN country TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='product_name') THEN
    ALTER TABLE public.orders ADD COLUMN product_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='total_amount') THEN
    ALTER TABLE public.orders ADD COLUMN total_amount NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='items_summary') THEN
    ALTER TABLE public.orders ADD COLUMN items_summary TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='razorpay_order_id') THEN
    ALTER TABLE public.orders ADD COLUMN razorpay_order_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='razorpay_payment_id') THEN
    ALTER TABLE public.orders ADD COLUMN razorpay_payment_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='razorpay_signature') THEN
    ALTER TABLE public.orders ADD COLUMN razorpay_signature TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='created_at') THEN
    ALTER TABLE public.orders ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='updated_at') THEN
    ALTER TABLE public.orders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Allow public read access on orders" ON public.orders;
CREATE POLICY "Allow public read access on orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access on orders" ON public.orders;
CREATE POLICY "Allow public insert access on orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on orders" ON public.orders;
CREATE POLICY "Allow public update access on orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access on orders" ON public.orders;
CREATE POLICY "Allow public delete access on orders" ON public.orders FOR DELETE USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';`;

const PRODUCTS_ONLY_SQL = `-- ==============================================================================
-- MY B SHOPPY - PRODUCTS TABLE SCHEMA (WITH MATCHING PRICE COLUMNS)
-- Run this in your Supabase SQL Editor:
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  slug TEXT,
  title TEXT NOT NULL DEFAULT '',
  name TEXT,
  sku TEXT,
  category TEXT DEFAULT 'General',
  cover_image TEXT,
  image_url TEXT,
  mrp NUMERIC DEFAULT 0,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC DEFAULT 0,
  price_per_unit NUMERIC DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  material TEXT,
  subtitle TEXT,
  original_price NUMERIC,
  category_id TEXT,
  badge TEXT,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  stone TEXT,
  variants JSONB DEFAULT '[]'::jsonb,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index on slug (allows multiple NULLs) so the frontend can upsert its catalog safely
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_uniq ON public.products(slug);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='title') THEN
    ALTER TABLE public.products ADD COLUMN title TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='name') THEN
    ALTER TABLE public.products ADD COLUMN name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sku') THEN
    ALTER TABLE public.products ADD COLUMN sku TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category') THEN
    ALTER TABLE public.products ADD COLUMN category TEXT DEFAULT 'General';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='cover_image') THEN
    ALTER TABLE public.products ADD COLUMN cover_image TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='image_url') THEN
    ALTER TABLE public.products ADD COLUMN image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='mrp') THEN
    ALTER TABLE public.products ADD COLUMN mrp NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sale_price') THEN
    ALTER TABLE public.products ADD COLUMN sale_price NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='price') THEN
    ALTER TABLE public.products ADD COLUMN price NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='price_per_unit') THEN
    ALTER TABLE public.products ADD COLUMN price_per_unit NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='quantity') THEN
    ALTER TABLE public.products ADD COLUMN quantity INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock') THEN
    ALTER TABLE public.products ADD COLUMN stock INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='badges') THEN
    ALTER TABLE public.products ADD COLUMN badges JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='description') THEN
    ALTER TABLE public.products ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='material') THEN
    ALTER TABLE public.products ADD COLUMN material TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='slug') THEN
    ALTER TABLE public.products ADD COLUMN slug TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='subtitle') THEN
    ALTER TABLE public.products ADD COLUMN subtitle TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='original_price') THEN
    ALTER TABLE public.products ADD COLUMN original_price NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category_id') THEN
    ALTER TABLE public.products ADD COLUMN category_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='badge') THEN
    ALTER TABLE public.products ADD COLUMN badge TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='rating') THEN
    ALTER TABLE public.products ADD COLUMN rating NUMERIC DEFAULT 5.0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='reviews_count') THEN
    ALTER TABLE public.products ADD COLUMN reviews_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stone') THEN
    ALTER TABLE public.products ADD COLUMN stone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='variants') THEN
    ALTER TABLE public.products ADD COLUMN variants JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='in_stock') THEN
    ALTER TABLE public.products ADD COLUMN in_stock BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='products_slug_uniq') THEN
    CREATE UNIQUE INDEX products_slug_uniq ON public.products(slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='created_at') THEN
    ALTER TABLE public.products ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='updated_at') THEN
    ALTER TABLE public.products ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
CREATE POLICY "Allow public read access on products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access on products" ON public.products;
CREATE POLICY "Allow public insert access on products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on products" ON public.products;
CREATE POLICY "Allow public update access on products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access on products" ON public.products;
CREATE POLICY "Allow public delete access on products" ON public.products FOR DELETE USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';`;

export const SupabaseSqlModal: React.FC<SupabaseSqlModalProps> = ({
  isOpen,
  onClose,
  initialError,
  defaultTab = 'unified',
}) => {
  const [activeTab, setActiveTab] = useState<'unified' | 'orders' | 'products'>(defaultTab);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentSql =
    activeTab === 'unified'
      ? SUPABASE_UNIFIED_SCHEMA_SQL
      : activeTab === 'orders'
      ? ORDERS_ONLY_SQL
      : PRODUCTS_ONLY_SQL;

  const handleCopy = (sqlText: string = currentSql) => {
    navigator.clipboard.writeText(sqlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0] || '';
  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : 'https://supabase.com/dashboard';

  return (
    <div
      id="supabase-sql-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="supabase-sql-modal"
        className="bg-[#12100e] border border-[#2d251a] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden text-[#d8cca8] my-auto animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#241e17] flex items-center justify-between bg-[#16120d]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#e5c158] text-[#0c0a09] shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#f3e7c4] tracking-wide">
                Unified Supabase SQL Database Schema
              </h2>
              <p className="text-xs text-[#8c7a4f]">
                Common, aligned schema for Products & COD Orders with price, status & RLS security
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8c7a4f] hover:text-[#f3e7c4] hover:bg-[#201a14] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 bg-[#16120d] border-b border-[#241e17] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('unified')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'unified'
                ? 'border-[#e5c158] text-[#e5c158] bg-[#1d1711]'
                : 'border-transparent text-[#8c7a4f] hover:text-[#f3e7c4]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Common Unified Schema (Both Tables)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'orders'
                ? 'border-[#e5c158] text-[#e5c158] bg-[#1d1711]'
                : 'border-transparent text-[#8c7a4f] hover:text-[#f3e7c4]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Orders Table Schema</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'products'
                ? 'border-[#e5c158] text-[#e5c158] bg-[#1d1711]'
                : 'border-transparent text-[#8c7a4f] hover:text-[#f3e7c4]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Products Table Schema</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          {initialError && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-start gap-2.5 text-amber-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Supabase Table Sync Notice</p>
                <p className="text-[11px] text-amber-200/90 mt-0.5 font-mono break-all">{initialError}</p>
                <p className="text-[11px] text-[#d8cca8] mt-1.5">
                  Run the SQL script below in your Supabase SQL Editor to add missing price columns and configure permissions.
                </p>
              </div>
            </div>
          )}

          {/* Quick Steps */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[#f3e7c4] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#e5c158]" />
              Quick 3-Step Setup in Supabase (10 Seconds)
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-[#d8cca8] bg-[#17130e] p-3.5 rounded-xl border border-[#262018]">
              <li>
                Click <span className="text-[#e5c158] font-bold">"Copy SQL Script"</span> below.
              </li>
              <li>
                Open your Supabase project's{' '}
                <a
                  href={sqlEditorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#e5c158] hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <span>SQL Editor</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                .
              </li>
              <li>
                Paste the SQL into the editor and click <span className="text-emerald-400 font-bold">RUN</span>. Both your <span className="text-[#e5c158] font-semibold">products</span> and <span className="text-[#e5c158] font-semibold">orders</span> tables will have matching price columns and live synchronization!
              </li>
            </ol>
          </div>

          {/* Schema Summary Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="p-2 rounded-lg bg-[#18140f] border border-[#262018]">
              <span className="text-[#8c7a4f] block text-[10px]">Price Columns</span>
              <span className="font-semibold text-[#f3e7c4]">price, sale_price, amount, mrp</span>
            </div>
            <div className="p-2 rounded-lg bg-[#18140f] border border-[#262018]">
              <span className="text-[#8c7a4f] block text-[10px]">Product Info</span>
              <span className="font-semibold text-[#f3e7c4]">variant, category, qty, sku</span>
            </div>
            <div className="p-2 rounded-lg bg-[#18140f] border border-[#262018]">
              <span className="text-[#8c7a4f] block text-[10px]">Security</span>
              <span className="font-semibold text-emerald-400">RLS + Public Policies</span>
            </div>
            <div className="p-2 rounded-lg bg-[#18140f] border border-[#262018]">
              <span className="text-[#8c7a4f] block text-[10px]">Realtime</span>
              <span className="font-semibold text-[#e5c158]">Broadcast Enabled</span>
            </div>
          </div>

          {/* SQL Code Block */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#8c7a4f]">
                {activeTab === 'unified'
                  ? 'Common Schema (Products & Orders)'
                  : activeTab === 'orders'
                  ? 'Orders Table Schema'
                  : 'Products Table Schema'}{' '}
                (SQL)
              </span>
              <button
                type="button"
                onClick={() => handleCopy()}
                className="px-3 py-1 rounded-lg bg-[#241e17] hover:bg-[#2e261d] text-[#f3e7c4] font-medium border border-[#382d20] flex items-center gap-1.5 text-[11px] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#e5c158]" />
                    <span>Copy SQL Script</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#0a0807] border border-[#241d14] text-[#a39474] font-mono text-[11px] overflow-x-auto max-h-72 selection:bg-[#e5c158] selection:text-black leading-relaxed">
              <code>{currentSql}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#241e17] flex items-center justify-between bg-[#16120d]">
          <a
            href={sqlEditorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#e5c158] hover:underline flex items-center gap-1.5 font-medium"
          >
            <span>Open Supabase SQL Editor</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleCopy()}
              className="px-4 py-2 rounded-xl bg-[#e5c158] hover:bg-[#f3cf65] text-[#0c0a09] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-[#d4af37]/20"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy SQL Script'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#2d251a] hover:bg-[#201a14] text-[#d8cca8] font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
