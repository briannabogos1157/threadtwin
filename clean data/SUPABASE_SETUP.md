# Supabase Setup Guide

## 🚀 Upload Your Cleaned Data to Supabase

### Step 1: Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Navigate to **Settings** > **API**
4. Copy your **Project URL** and **anon/public key**

### Step 2: Update Your Environment Variables

Edit the `.env` file in this directory and replace the placeholder values:

```bash
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### Step 3: Create the Database Table

In your Supabase dashboard, go to **SQL Editor** and run this SQL to create the products table:

```sql
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
    image_url TEXT,
    color VARCHAR(255)
);
```

### Step 4: Upload Your Data

Run the upload script:

```bash
python3 upload_to_supabase.py
```

### Step 5: Verify Your Data

1. Go to your Supabase dashboard
2. Navigate to **Table Editor**
3. Select the **products** table
4. You should see all 24 products uploaded!

## 📊 What Gets Uploaded

- **24 products** from your cleaned CSV
- **12 Skims products** (bras, underwear, loungewear, swimwear)
- **12 Lululemon products** (activewear, tanks, shorts, leggings)

## 🔧 Troubleshooting

### Common Issues:

1. **"Missing Supabase credentials"**
   - Make sure your `.env` file has the correct URL and key
   - Check that the file is in the same directory as the script

2. **"Table doesn't exist"**
   - Run the SQL command in Step 3 to create the table

3. **"Permission denied"**
   - Make sure you're using the **anon key** (not the service role key)
   - Check your Row Level Security (RLS) settings

### Need Help?

- Check the Supabase [documentation](https://supabase.com/docs)
- Verify your API keys in the Supabase dashboard
- Make sure your project is active and not paused

## 🎉 Success!

Once uploaded, you can:
- Query your data using Supabase's SQL editor
- Build applications that connect to your database
- Use Supabase's real-time features
- Set up authentication and authorization 