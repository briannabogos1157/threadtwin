-- Fix Permissions and Check Table Status
-- Run this in your Supabase SQL Editor

-- 1. Check if the products table exists
SELECT 
    table_name, 
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'products';

-- 2. Drop the existing table if it exists (to fix constraints)
DROP TABLE IF EXISTS public.products;

-- 3. Create the table with proper nullable columns
CREATE TABLE public.products (
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

-- 4. Grant ALL permissions to service_role
GRANT ALL PRIVILEGES ON TABLE public.products TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- 5. Grant permissions to anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 6. Disable Row Level Security
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_source ON public.products(source);

-- 8. Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position;

-- 9. Test insert a record with all required fields
INSERT INTO public.products (brand, name, price, url, category, source, affiliate_link, title)
VALUES ('Test Brand', 'Test Product', '99.99', 'https://example.com', 'test', 'test', 'https://example.com', 'Test Product Title')
ON CONFLICT DO NOTHING;

-- 10. Check if the test record was inserted
SELECT COUNT(*) as total_products FROM public.products;

-- 11. Show all products
SELECT id, brand, name, price, category, source, title FROM public.products LIMIT 5; 