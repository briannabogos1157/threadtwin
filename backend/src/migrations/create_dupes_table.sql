-- Create dupes table
CREATE TABLE IF NOT EXISTS dupes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_product TEXT NOT NULL,
    dupe_product TEXT NOT NULL,
    price_comparison TEXT NOT NULL,
    similarity_reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 