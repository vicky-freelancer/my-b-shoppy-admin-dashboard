-- Fresh database schema for My B Shoppy (MariaDB 10.6+).
-- Run with an account permitted to create databases and tables.
-- This creates tables; it does not migrate existing PostgreSQL data.
-- Store timestamps in UTC. JSON columns hold arrays, e.g. ["Featured"].
CREATE DATABASE IF NOT EXISTS my_b_shoppy
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE my_b_shoppy;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subcategories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  category_id VARCHAR(100) NOT NULL,
  name VARCHAR(191) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  featured_image TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_subcategories_slug (category_id, slug),
  UNIQUE KEY uq_subcategories_name (category_id, name),
  KEY idx_subcategories_active (category_id, is_active),
  CONSTRAINT fk_subcategories_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(191),
  title VARCHAR(255) NOT NULL DEFAULT '',
  name VARCHAR(255),
  sku VARCHAR(191),
  category VARCHAR(255) DEFAULT 'General',
  category_id VARCHAR(100),
  subcategory_id BIGINT UNSIGNED,
  subcategory VARCHAR(255),
  cover_image TEXT,
  image_url TEXT,
  mrp DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  price_per_unit DECIMAL(12,2) NOT NULL DEFAULT 0,
  original_price DECIMAL(12,2),
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  badges JSON NOT NULL DEFAULT '[]',
  description TEXT,
  material VARCHAR(255),
  subtitle TEXT,
  badge VARCHAR(255),
  rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  reviews_count INT UNSIGNED NOT NULL DEFAULT 0,
  stone VARCHAR(255),
  variants JSON NOT NULL DEFAULT '[]',
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_products_slug (slug),
  KEY idx_products_sku (sku),
  KEY idx_products_category (category_id),
  KEY idx_products_subcategory (subcategory_id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_products_subcategory FOREIGN KEY (subcategory_id)
    REFERENCES subcategories(id) ON DELETE SET NULL,
  CONSTRAINT chk_products_rating CHECK (rating BETWEEN 0 AND 5),
  CONSTRAINT chk_products_badges CHECK (JSON_TYPE(badges) = 'ARRAY'),
  CONSTRAINT chk_products_variants CHECK (JSON_TYPE(variants) = 'ARRAY')
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL DEFAULT 'Customer',
  email VARCHAR(254),
  phone VARCHAR(32) NOT NULL DEFAULT '',
  city VARCHAR(255) DEFAULT 'Unspecified',
  address TEXT NOT NULL DEFAULT '',
  country VARCHAR(100) DEFAULT '',
  category VARCHAR(255) DEFAULT 'General',
  product_variant VARCHAR(255) NOT NULL DEFAULT 'Standard Product',
  product_id BIGINT UNSIGNED,
  product_name VARCHAR(255),
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  price_per_unit DECIMAL(12,2) NOT NULL DEFAULT 0,
  mrp DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  cod_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(100) DEFAULT 'Cash on Delivery (COD)',
  tracking_number VARCHAR(191),
  notes TEXT,
  items_summary TEXT,
  razorpay_order_id VARCHAR(191),
  razorpay_payment_id VARCHAR(191),
  razorpay_signature VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_orders_status_created (status, created_at),
  KEY idx_orders_created (created_at),
  KEY idx_orders_phone (phone),
  KEY idx_orders_email (email),
  KEY idx_orders_product (product_id),
  KEY idx_orders_razorpay (razorpay_order_id),
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT chk_orders_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;

-- Match the nine canonical categories in the dashboard.
INSERT INTO categories (id, name, slug) VALUES
  ('hair-accessories', 'Hair Accessories', 'hair-accessories'),
  ('ad-jewellery', 'AD Jewellery', 'ad-jewellery'),
  ('bags', 'Bags', 'bags'),
  ('anti-tarnish-jewellery', 'Anti Tarnish Jewellery', 'anti-tarnish-jewellery'),
  ('stationery-and-gifts', 'Stationery & Gifts', 'stationery-and-gifts'),
  ('bows-and-scrunchies', 'Bows & Scrunchies', 'bows-and-scrunchies'),
  ('key-chains', 'Key Chains', 'key-chains'),
  ('mobile-charms', 'Mobile Charms', 'mobile-charms'),
  ('men-accessories', 'Men accessories', 'men-accessories')
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- Customers are derived from orders in the current dashboard.
-- Admin authentication and app settings currently live outside these tables.
-- The API must keep legacy price/stock aliases and category labels aligned,
-- validate that a product's subcategory belongs to its category, and handle
-- transactions, authorization, and JSON encoding/decoding.
-- IF NOT EXISTS does not update the structure of existing tables.
