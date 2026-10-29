import { supabase } from './supabase';
import { Category, Subcategory } from '../types';

const LOCAL_STORAGE_SUBCATEGORIES_KEY = 'mybshoppy_subcategories_cache_v2';
const LOCAL_STORAGE_CATEGORIES_KEY = 'mybshoppy_categories_cache_v2';

/**
 * The only parent categories allowed across the dashboard and storefront.
 * Order here is the order shown in category dropdowns.
 */
export const DEFAULT_CATEGORY_NAMES = [
  'Hair Accessories',
  'AD Jewellery',
  'Bags',
  'Anti Tarnish Jewellery',
  'Stationery and Gifts',
  'Bows & Scrunchies',
  'Key chains',
  'Mobile charms',
  'Men accessories',
];

export function slugifyCategory(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildFallbackCategories(): Category[] {
  return DEFAULT_CATEGORY_NAMES.map((name) => {
    const id = slugifyCategory(name);
    return {
      id,
      name,
      slug: id,
      is_active: true,
    };
  });
}

/** Treat common spelling variants as the canonical parent category. */
function categoryNameKey(value: string): string {
  const key = value.trim().toLowerCase().replace(/\s+/g, ' ');
  const aliases: Record<string, string> = {
    'bows': 'bows & scrunchies',
    'scrunchies': 'bows & scrunchies',
    'bows and scrunchies': 'bows & scrunchies',
    'bow & scrunchies': 'bows & scrunchies',
    'keychains': 'key chains',
    'key chain': 'key chains',
    'mobile charm': 'mobile charms',
    'mens collection': 'men accessories',
    'mens accessories': 'men accessories',
    'ad jewellary': 'ad jewellery',
    'anti-tarnish jewellery': 'anti tarnish jewellery',
    'stationary and gifts': 'stationery and gifts',
    'stationary & gifts': 'stationery and gifts',
    'stationery & gifts': 'stationery and gifts',
  };
  return aliases[key] || key;
}

export function getCachedCategories(): Category[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed reading cached categories', e);
  }
  return buildFallbackCategories();
}

function saveCachedCategories(categories: Category[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(categories));
  } catch {
    // Best effort only
  }
}

export function getCachedSubcategories(): Subcategory[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUBCATEGORIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed reading cached subcategories', e);
  }
  return [];
}

function saveCachedSubcategories(subcategories: Subcategory[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SUBCATEGORIES_KEY, JSON.stringify(subcategories));
  } catch {
    // Best effort only
  }
}

function normalizeSubcategory(row: any): Subcategory {
  return {
    id: row.id,
    category_id: String(row.category_id || ''),
    name: row.name || '',
    slug: row.slug || slugifyCategory(row.name || ''),
    featured_image: row.featured_image || row.image_url || '',
    is_active: row.is_active !== false,
    sort_order: Number(row.sort_order) || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getCategories(): Promise<{
  categories: Category[];
  error?: string;
  source: 'supabase' | 'cache';
}> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      const cached = getCachedCategories();
      return { categories: cached, error: error.message, source: 'cache' };
    }

    if (data && data.length > 0) {
      const rows: Category[] = data.map((row: any) => ({
        id: String(row.id || row.slug || slugifyCategory(row.name || '')),
        name: row.name || '',
        slug: row.slug || slugifyCategory(row.name || ''),
        image_url: row.image_url || undefined,
        is_active: row.is_active !== false,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      const byName = new Map(
        rows.map((category) => [categoryNameKey(category.name), category])
      );

      // Always expose exactly the nine approved parent categories, in order.
      const categories: Category[] = DEFAULT_CATEGORY_NAMES.map((name) => {
        const existing = byName.get(categoryNameKey(name));
        if (existing) return { ...existing, name };
        const id = slugifyCategory(name);
        return { id, name, slug: id, is_active: true };
      });

      saveCachedCategories(categories);
      return { categories, source: 'supabase' };
    }

    const fallback = buildFallbackCategories();
    saveCachedCategories(fallback);
    return { categories: fallback, source: 'cache' };
  } catch (err: any) {
    return { categories: getCachedCategories(), error: err.message, source: 'cache' };
  }
}

export async function getSubcategories(): Promise<{
  subcategories: Subcategory[];
  error?: string;
  source: 'supabase' | 'cache';
}> {
  try {
    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return { subcategories: getCachedSubcategories(), error: error.message, source: 'cache' };
    }

    if (data) {
      const subcategories = data.map(normalizeSubcategory);
      saveCachedSubcategories(subcategories);
      return { subcategories, source: 'supabase' };
    }

    const cached = getCachedSubcategories();
    return { subcategories: cached, source: 'cache' };
  } catch (err: any) {
    return { subcategories: getCachedSubcategories(), error: err.message, source: 'cache' };
  }
}

export interface SubcategoryInput {
  category_id: string;
  name: string;
  featured_image: string;
  is_active?: boolean;
  sort_order?: number;
}

function validateInput(input: SubcategoryInput): string | null {
  if (!input.category_id || !input.category_id.trim()) {
    return 'Parent category is required.';
  }
  const name = input.name.trim();
  if (!name) return 'Subcategory name is required.';
  if (name.length < 2) return 'Subcategory name must be at least 2 characters.';
  if (name.length > 80) return 'Subcategory name must be 80 characters or fewer.';
  if (!input.featured_image || !input.featured_image.trim()) {
    return 'Featured image is required.';
  }
  return null;
}

export async function createSubcategory(
  input: SubcategoryInput
): Promise<{ success: boolean; subcategory?: Subcategory; error?: string; isDatabaseError?: boolean }> {
  const validationError = validateInput(input);
  if (validationError) return { success: false, error: validationError };

  const name = input.name.trim();
  const slug = slugifyCategory(name);
  if (!slug) return { success: false, error: 'Subcategory name must contain letters or numbers.' };

  try {
    const { data: existing } = await supabase
      .from('subcategories')
      .select('id')
      .eq('category_id', input.category_id)
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: 'A subcategory with this name already exists under the selected category.',
      };
    }

    const payload = {
      category_id: input.category_id,
      name,
      slug,
      featured_image: input.featured_image,
      is_active: input.is_active !== false,
      sort_order: Number(input.sort_order) || 0,
    };

    const { data, error } = await supabase
      .from('subcategories')
      .insert([payload])
      .select()
      .single();

    if (error) {
      const message =
        error.code === '23505'
          ? 'A subcategory with this name already exists under the selected category.'
          : error.message;
      return { success: false, error: message, isDatabaseError: true };
    }

    const created = normalizeSubcategory(data);
    saveCachedSubcategories([
      created,
      ...getCachedSubcategories().filter((s) => String(s.id) !== String(created.id)),
    ]);
    return { success: true, subcategory: created };
  } catch (err: any) {
    return { success: false, error: err.message, isDatabaseError: true };
  }
}

export async function updateSubcategory(
  id: string | number,
  input: SubcategoryInput
): Promise<{ success: boolean; subcategory?: Subcategory; error?: string; isDatabaseError?: boolean }> {
  const validationError = validateInput(input);
  if (validationError) return { success: false, error: validationError };

  const name = input.name.trim();
  const slug = slugifyCategory(name);
  if (!slug) return { success: false, error: 'Subcategory name must contain letters or numbers.' };

  try {
    const { data: duplicate } = await supabase
      .from('subcategories')
      .select('id')
      .eq('category_id', input.category_id)
      .eq('slug', slug)
      .neq('id', id)
      .maybeSingle();

    if (duplicate) {
      return {
        success: false,
        error: 'A subcategory with this name already exists under the selected category.',
      };
    }

    const { data, error } = await supabase
      .from('subcategories')
      .update({
        category_id: input.category_id,
        name,
        slug,
        featured_image: input.featured_image,
        is_active: input.is_active !== false,
        sort_order: Number(input.sort_order) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const message =
        error.code === '23505'
          ? 'A subcategory with this name already exists under the selected category.'
          : error.message;
      return { success: false, error: message, isDatabaseError: true };
    }

    const updated = normalizeSubcategory(data);
    saveCachedSubcategories(
      getCachedSubcategories().map((s) => (String(s.id) === String(id) ? updated : s))
    );
    return { success: true, subcategory: updated };
  } catch (err: any) {
    return { success: false, error: err.message, isDatabaseError: true };
  }
}

export async function setSubcategoryActive(
  id: string | number,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('subcategories')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    saveCachedSubcategories(
      getCachedSubcategories().map((s) =>
        String(s.id) === String(id) ? { ...s, is_active: isActive } : s
      )
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteSubcategory(
  id: string | number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { count, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('subcategory_id', id);

    if (!countError && count && count > 0) {
      return {
        success: false,
        error: `Cannot delete: ${count} product${count === 1 ? ' is' : 's are'} assigned to this subcategory. Reassign them first.`,
      };
    }

    const { error } = await supabase.from('subcategories').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    saveCachedSubcategories(getCachedSubcategories().filter((s) => String(s.id) !== String(id)));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export const SUBCATEGORIES_SCHEMA_SQL = `-- ==============================================================================
-- MY B SHOPPY - CATEGORIES & SUBCATEGORIES MIGRATION (SAFE / IDEMPOTENT)
-- Run this in your Supabase SQL Editor. It creates missing tables/columns and
-- normalises the parent catalogue to the nine approved categories. It never
-- drops tables or deletes products/orders.
-- ==============================================================================

-- 1. CATEGORIES (parent categories, one row per category)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- The product table may predate category_id, so add it before backfilling.
DO $$
BEGIN
  IF to_regclass('public.products') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN category_id TEXT;
  END IF;
END $$;

-- Backfill categories from existing product rows (keeps current catalog working)
DO $$
BEGIN
  IF to_regclass('public.products') IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.categories (id, name, slug)
  SELECT DISTINCT
    COALESCE(
      NULLIF(trim(p.category_id), ''),
      trim(both '-' from lower(regexp_replace(coalesce(p.category, ''), '[^a-zA-Z0-9]+', '-', 'g')))
    ) AS id,
    trim(p.category) AS name,
    trim(both '-' from lower(regexp_replace(coalesce(p.category, ''), '[^a-zA-Z0-9]+', '-', 'g'))) AS slug
  FROM public.products p
  WHERE trim(coalesce(p.category, '')) <> ''
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Seed the nine approved parent categories
INSERT INTO public.categories (id, name, slug) VALUES
  ('hair-accessories', 'Hair Accessories', 'hair-accessories'),
  ('ad-jewellery', 'AD Jewellery', 'ad-jewellery'),
  ('bags', 'Bags', 'bags'),
  ('anti-tarnish-jewellery', 'Anti Tarnish Jewellery', 'anti-tarnish-jewellery'),
  ('stationery-and-gifts', 'Stationery and Gifts', 'stationery-and-gifts'),
  ('bows-and-scrunchies', 'Bows & Scrunchies', 'bows-and-scrunchies'),
  ('key-chains', 'Key chains', 'key-chains'),
  ('mobile-charms', 'Mobile charms', 'mobile-charms'),
  ('men-accessories', 'Men accessories', 'men-accessories')
ON CONFLICT (id) DO NOTHING;

-- 2. SUBCATEGORIES
CREATE TABLE IF NOT EXISTS public.subcategories (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  featured_image TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Parent category foreign key (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subcategories_category_id_fkey') THEN
    ALTER TABLE public.subcategories
      ADD CONSTRAINT subcategories_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Prevent duplicate slugs and names within the same parent category
CREATE UNIQUE INDEX IF NOT EXISTS subcategories_category_slug_uniq
  ON public.subcategories (category_id, slug);
CREATE UNIQUE INDEX IF NOT EXISTS subcategories_category_name_uniq
  ON public.subcategories (category_id, lower(name));
CREATE INDEX IF NOT EXISTS subcategories_category_active_idx
  ON public.subcategories (category_id, is_active);

-- 3. PRODUCT -> SUBCATEGORY MAPPING (nullable / backward compatible)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN subcategory_id BIGINT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE public.products ADD COLUMN subcategory TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_subcategory_id_fkey') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_subcategory_id_fkey
      FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS products_subcategory_idx ON public.products (subcategory_id);

-- 4. ENFORCE THE NINE APPROVED PARENT CATEGORIES
-- Existing products from retired categories are moved to the closest approved
-- parent so no product disappears. Only the nine rows below remain.
DO $$
DECLARE
  allowed_ids TEXT[] := ARRAY[
    'hair-accessories',
    'ad-jewellery',
    'bags',
    'anti-tarnish-jewellery',
    'stationery-and-gifts',
    'bows-and-scrunchies',
    'key-chains',
    'mobile-charms',
    'men-accessories'
  ];
BEGIN
  UPDATE public.products
  SET category_id = 'bows-and-scrunchies', category = 'Bows & Scrunchies'
  WHERE category_id IN ('bows', 'scrunchies', 'bow-and-scrunchies', 'bows-and-scrunchies')
     OR lower(coalesce(category, '')) IN ('bows', 'scrunchies', 'bow & scrunchies', 'bows & scrunchies', 'bows and scrunchies');

  UPDATE public.products SET category_id = 'key-chains', category = 'Key chains'
  WHERE category_id IN ('keychains', 'key-chain', 'key-chains') OR lower(category) IN ('key chains', 'keychains', 'key chain');
  UPDATE public.products SET category_id = 'mobile-charms', category = 'Mobile charms'
  WHERE category_id IN ('mobile-charm', 'mobile-charms') OR lower(category) IN ('mobile charms', 'mobile charm');
  UPDATE public.products SET category_id = 'men-accessories', category = 'Men accessories'
  WHERE category_id IN ('mens-collection', 'mens-accessories', 'men-accessories') OR lower(category) IN ('mens collection', 'mens accessories', 'men accessories');

  UPDATE public.products
  SET category_id = 'bags', category = 'Bags'
  WHERE category_id IN ('handbags', 'hand-bags')
     OR lower(coalesce(category, '')) IN ('handbags', 'hand bags');

  UPDATE public.products
  SET category_id = 'ad-jewellery', category = 'AD Jewellery'
  WHERE category_id IN (
      'artificial-jewels', 'artificial-jewellery', 'earrings', 'bracelets',
      'rings', 'necklaces', 'pendants', 'chains'
    )
     OR lower(coalesce(category, '')) IN (
      'artificial jewels', 'artificial jewellery', 'earrings', 'bracelets',
      'rings', 'necklaces', 'pendants', 'chains'
    );

  UPDATE public.products
  SET category_id = 'stationery-and-gifts', category = 'Stationery and Gifts'
  WHERE category_id = 'stationery-gift-items'
     OR lower(coalesce(category, '')) IN ('stationery gift items', 'stationary and gifts');

  -- Products backfilled above may still have a NULL category_id. Derive it from
  -- the category label before the fallback so approved categories are kept.
  UPDATE public.products
  SET category_id = trim(both '-' from lower(regexp_replace(coalesce(category, ''), '[^a-zA-Z0-9]+', '-', 'g')))
  WHERE (category_id IS NULL OR trim(category_id) = '')
    AND trim(coalesce(category, '')) <> '';

  -- Anything still outside the approved list is folded into AD Jewellery.
  UPDATE public.products
  SET category_id = 'ad-jewellery', category = 'AD Jewellery'
  WHERE category_id IS NULL OR category_id <> ALL (allowed_ids);

  -- Preserve subcategories that sit under an approved category with a legacy id.
  UPDATE public.subcategories s
  SET category_id = m.new_id
  FROM (
    SELECT c.id AS old_id,
           CASE lower(c.name)
             WHEN 'bows' THEN 'bows-and-scrunchies'
             WHEN 'scrunchies' THEN 'bows-and-scrunchies'
             WHEN 'bows & scrunchies' THEN 'bows-and-scrunchies'
             WHEN 'bows and scrunchies' THEN 'bows-and-scrunchies'
             WHEN 'key chains' THEN 'key-chains'
             WHEN 'mobile charms' THEN 'mobile-charms'
             WHEN 'mens collection' THEN 'men-accessories'
             WHEN 'men accessories' THEN 'men-accessories'
             WHEN 'mens accessories' THEN 'men-accessories'
             WHEN 'hair accessories' THEN 'hair-accessories'
             WHEN 'ad jewellery' THEN 'ad-jewellery'
             WHEN 'ad jewellary' THEN 'ad-jewellery'
             WHEN 'bags' THEN 'bags'
             WHEN 'anti tarnish jewellery' THEN 'anti-tarnish-jewellery'
             WHEN 'stationery and gifts' THEN 'stationery-and-gifts'
             WHEN 'stationary and gifts' THEN 'stationery-and-gifts'
           END AS new_id
    FROM public.categories c
    WHERE lower(c.name) IN (
      'bows', 'scrunchies', 'bows & scrunchies', 'bows and scrunchies',
      'key chains', 'mobile charms', 'mens collection', 'men accessories', 'mens accessories',
      'hair accessories', 'ad jewellery', 'ad jewellary', 'bags',
      'anti tarnish jewellery', 'stationery and gifts', 'stationary and gifts'
    )
  ) m
  WHERE s.category_id = m.old_id
    AND m.new_id IS NOT NULL
    AND m.old_id <> m.new_id
    AND NOT EXISTS (
      SELECT 1 FROM public.subcategories x
      WHERE x.category_id = m.new_id AND x.slug = s.slug
    );

  -- Remove subcategories and parent categories that are not approved.
  -- Legacy subcategories are retained for manual review.
  -- Legacy parent categories are retained for manual review.

  -- Keep the product category label aligned with its canonical parent id.
  UPDATE public.products p
  SET category = c.name
  FROM public.categories c
  WHERE p.category_id = c.id AND p.category IS DISTINCT FROM c.name;
END $$;

-- 5. ROW LEVEL SECURITY (matches the existing dashboard/commerce convention)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.subcategories TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Allow public read access on categories" ON public.categories;
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public write access on categories" ON public.categories;
CREATE POLICY "Allow public write access on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access on subcategories" ON public.subcategories;
CREATE POLICY "Allow public read access on subcategories" ON public.subcategories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public write access on subcategories" ON public.subcategories;
CREATE POLICY "Allow public write access on subcategories" ON public.subcategories FOR ALL USING (true) WITH CHECK (true);

-- 6. REALTIME
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'subcategories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subcategories;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
`;
