-- Create the products table with all required columns
-- Run this in your Supabase dashboard under SQL Editor

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(255),
    name TEXT,
    fabric TEXT,
    price VARCHAR(50),
    url TEXT,
    image TEXT,
    category VARCHAR(255),
    source VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    title TEXT,
    image_url TEXT,
    color VARCHAR(255),
    affiliate_link TEXT
);

-- Disable Row Level Security for testing
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Optional: Add some indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source); 