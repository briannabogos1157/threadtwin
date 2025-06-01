-- Add new columns to the products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS affiliate_link TEXT;

-- Copy existing data to new columns
UPDATE products
SET 
    title = name,
    image_url = image,
    affiliate_link = url
WHERE title IS NULL;

-- Add any necessary indexes
CREATE INDEX IF NOT EXISTS idx_products_affiliate_link ON products(affiliate_link);

-- Add constraints
ALTER TABLE products
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN image_url SET NOT NULL,
ALTER COLUMN affiliate_link SET NOT NULL; 