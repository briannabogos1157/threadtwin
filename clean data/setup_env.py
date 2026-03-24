#!/usr/bin/env python3
"""
Setup script to configure Supabase environment variables
"""

import os

def setup_environment():
    """Set up environment variables for Supabase"""
    
    print("🔧 Supabase Environment Setup")
    print("=" * 40)
    
    # Get Supabase URL
    print("\n1. Enter your Supabase Project URL:")
    print("   (e.g., https://your-project-id.supabase.co)")
    url = input("   URL: ").strip()
    
    if not url:
        print("❌ URL is required!")
        return False
    
    # Get Supabase Key
    print("\n2. Enter your Supabase anon/public key:")
    print("   (Find this in your Supabase dashboard under Settings > API)")
    key = input("   Key: ").strip()
    
    if not key:
        print("❌ Key is required!")
        return False
    
    # Create .env file content
    env_content = f"""SUPABASE_URL={url}
SUPABASE_KEY={key}
"""
    
    # Write to .env file
    try:
        with open('.env', 'w') as f:
            f.write(env_content)
        print("\n✅ Environment file created successfully!")
        print("📁 File: .env")
        return True
    except Exception as e:
        print(f"\n❌ Error creating .env file: {e}")
        return False

def test_connection():
    """Test the Supabase connection"""
    try:
        from dotenv import load_dotenv
        from supabase import create_client, Client
        
        load_dotenv()
        
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        
        if not url or not key:
            print("❌ Environment variables not found!")
            return False
        
        print("\n🔗 Testing Supabase connection...")
        supabase: Client = create_client(url, key)
        
        # Try a simple query to test connection
        result = supabase.table('products').select('*').limit(1).execute()
        print("✅ Connection successful!")
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    print("Welcome to the Supabase setup!")
    
    # Check if .env already exists
    if os.path.exists('.env'):
        print("📁 .env file already exists!")
        choice = input("Do you want to overwrite it? (y/N): ").strip().lower()
        if choice != 'y':
            print("Setup cancelled.")
            exit(0)
    
    # Setup environment
    if setup_environment():
        print("\n🚀 Ready to upload data!")
        print("\nNext steps:")
        print("1. Make sure your Supabase table exists (run create_table.sql)")
        print("2. Run: python3 upload_revolve_data.py")
        
        # Test connection
        test_choice = input("\nTest connection now? (Y/n): ").strip().lower()
        if test_choice != 'n':
            test_connection()
    else:
        print("\n❌ Setup failed. Please try again.") 