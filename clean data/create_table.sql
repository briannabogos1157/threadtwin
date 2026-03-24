-- Create the products table in Supabase
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
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    title TEXT,
    image_url TEXT
);

-- Optional: Disable Row Level Security for testing
ALTER TABLE products DISABLE ROW LEVEL SECURITY; 