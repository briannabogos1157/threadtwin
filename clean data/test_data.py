import pandas as pd
import json

# Read the CSV and test the data format
print("🔍 Testing data format...")

df = pd.read_csv("cleaned_products.csv")

# Remove id column
if 'id' in df.columns:
    df = df.drop('id', axis=1)

# Clean up text fields
df['name'] = df['name'].astype(str).str.replace('\n', ' ').str.strip()
df['title'] = df['title'].astype(str).str.replace('\n', ' ').str.strip()

# Convert empty strings to None
df = df.replace('', None)

# Convert to records
records = df.to_dict('records')

print(f"📊 Total records: {len(records)}")

# Test JSON serialization
try:
    json_data = json.dumps(records, default=str)
    print("✅ JSON serialization successful!")
    print(f"📏 JSON size: {len(json_data)} characters")
    
    # Show first record
    print("\n📋 First record:")
    print(json.dumps(records[0], indent=2, default=str))
    
except Exception as e:
    print(f"❌ JSON serialization failed: {e}")

# Check for problematic values
print("\n🔍 Checking for problematic values...")
for i, record in enumerate(records):
    for key, value in record.items():
        if value is not None and not isinstance(value, (str, int, float, bool)):
            print(f"⚠️  Record {i+1}, field '{key}': {type(value)} = {value}")
        elif isinstance(value, str) and len(value) > 1000:
            print(f"⚠️  Record {i+1}, field '{key}': Very long string ({len(value)} chars)") 