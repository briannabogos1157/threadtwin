from supabase_client import supabase
import os

def read_sql_file(filename):
    with open(filename, 'r') as file:
        return file.read()

def update_schema():
    try:
        print("🔄 Starting schema update...")
        
        # Read the SQL migration
        sql = read_sql_file('migrations/add_affiliate_fields.sql')
        
        # Execute the SQL using Supabase's raw query feature
        response = supabase.table('products').select('*').execute()
        print("✅ Current table structure:", response)
        
        # Note: For schema modifications, you'll need to use the Supabase dashboard
        print("\n⚠️ Important: Please execute the following SQL in your Supabase dashboard SQL editor:")
        print("\n" + sql)
        
        print("\n📝 Instructions:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Select your project")
        print("3. Go to 'SQL Editor'")
        print("4. Create a 'New Query'")
        print("5. Paste the SQL above")
        print("6. Click 'Run'")
        
    except Exception as e:
        print(f"❌ Error updating schema: {str(e)}")

if __name__ == "__main__":
    update_schema() 