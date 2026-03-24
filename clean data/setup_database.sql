-- Complete Database Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Create the products table with all required columns
CREATE TABLE IF NOT EXISTS public.products (
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

-- 2. Grant all permissions to the service role
GRANT ALL PRIVILEGES ON TABLE public.products TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- 3. Grant permissions to the anon role (for read access)
GRANT SELECT ON TABLE public.products TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Disable Row Level Security for testing
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_source ON public.products(source);

-- 6. Verify the table was created
SELECT 
    table_name, 
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'products';

-- 7. Show table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position; 