# LTK Affiliate Product Manager

This script helps you manage products in your Supabase database for LTK affiliate links.

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the root directory with your Supabase credentials:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage

Run the script to add a product:
```bash
python add_product.py
```

The script will:
- Load your Supabase credentials from the `.env` file
- Add the product to your Supabase database
- Display a success message with the product ID if successful
- Show an error message if something goes wrong

## Error Handling

The script includes error handling for:
- Missing environment variables
- Supabase connection issues
- Database insertion errors 