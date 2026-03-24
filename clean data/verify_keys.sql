-- Verify Keys and Permissions
-- Run this in your Supabase SQL Editor

-- 1. Check current user and role
SELECT current_user, current_database(), current_schema();

-- 2. Check if products table exists
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'products';

-- 3. Check table permissions
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'products';

-- 4. Check if service_role exists and has proper permissions
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles 
WHERE rolname IN ('service_role', 'anon', 'authenticated');

-- 5. Grant explicit permissions to service_role
GRANT ALL PRIVILEGES ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 6. Grant specific permissions to products table
GRANT ALL PRIVILEGES ON TABLE public.products TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 7. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'products';

-- 8. Disable RLS if it's enabled
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 9. Test insert as current user
INSERT INTO public.products (brand, name, price, url, category, source, affiliate_link, title)
VALUES ('SQL Test', 'SQL Test Product', '88.88', 'https://sql-test.com', 'sql-test', 'sql-test', 'https://sql-test.com', 'SQL Test Title')
ON CONFLICT DO NOTHING;

-- 10. Verify the insert worked
SELECT COUNT(*) as total_products FROM public.products;
SELECT id, brand, name, price FROM public.products ORDER BY id DESC LIMIT 3; 