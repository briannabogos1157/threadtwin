# How to Add Your Own Products and Images to ThreadTwin

## 🎯 Overview

ThreadTwin now uses **Supabase database** to store all products! This means your products are persistent and won't disappear when the server restarts. Here are the best ways to add your own products:

## 🚀 Option 1: Admin API (Recommended)

### Use the Python Script
1. Edit `add_sample_products.py` with your product details
2. Run: `python3 add_sample_products.py`

### Example Product Data:
```python
product_data = {
    "title": "My Awesome Dress",
    "description": "A beautiful dress perfect for summer",
    "price": 89.99,
    "currency": "USD",
    "brand": "My Brand",
    "imageUrl": "https://your-image-url.com/dress.jpg",
    "productUrl": "https://my-store.com/dress",
    "tags": ["dress", "summer", "casual"],
    "fabric": "100% Cotton"
}
```

### Use curl directly:
```bash
curl -X POST https://api.threadtwin.com/api/products/admin/add \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Your Product",
    "description": "Your description",
    "price": 99.99,
    "brand": "Your Brand",
    "imageUrl": "https://your-image-url.com/image.jpg",
    "fabric": "Your fabric description"
  }'
```

### Complete curl example with all fields:
```bash
curl -X POST https://api.threadtwin.com/api/products/admin/add \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Premium Cotton Dress",
    "description": "A beautiful dress made from high-quality materials",
    "price": 89.99,
    "currency": "USD",
    "brand": "Your Brand",
    "imageUrl": "https://your-image-url.com/dress.jpg",
    "productUrl": "https://your-store.com/dress",
    "tags": ["dress", "casual", "summer"],
    "fabric": "100% Organic Cotton"
  }'
```

## 🗄️ Option 2: Direct Supabase Database Access

### Via Supabase Dashboard
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project → Table Editor
3. Select the `products` table
4. Click "Insert Row" and add your product data

### Required Fields for Supabase:
```sql
INSERT INTO products (
  title,
  name,
  description,
  price,
  brand,
  image_url,
  url,
  affiliate_link,
  fabric,
  category,
  source
) VALUES (
  'Your Product Title',
  'Your Product Name',
  'Your product description',
  99.99,
  'Your Brand',
  'https://your-image-url.com/image.jpg',
  'https://your-store.com/product',
  'https://your-store.com/product',
  'Your fabric description',
  'your-category',
  'manual'
);
```

### Complete Supabase example:
```sql
INSERT INTO products (
  title,
  name,
  description,
  price,
  brand,
  image_url,
  url,
  affiliate_link,
  fabric,
  category,
  source
) VALUES (
  'Premium Cotton Dress',
  'Premium Cotton Dress',
  'A beautiful dress made from high-quality organic cotton with a flattering fit.',
  89.99,
  'Your Brand',
  'https://your-image-url.com/dress.jpg',
  'https://your-store.com/dress',
  'https://your-store.com/dress',
  '100% Organic Cotton',
  'dress',
  'manual'
);
```

## 🖼️ Option 3: Create a Simple Upload Interface

### Frontend Admin Panel
You can create a simple admin interface in your frontend:

```typescript
// Example React component for adding products
const AddProductForm = () => {
  const [product, setProduct] = useState({
    title: '',
    description: '',
    price: '',
    brand: '',
    imageUrl: '',
    fabric: '',
    tags: []
  });

  const handleSubmit = async () => {
    const response = await fetch('https://api.threadtwin.com/api/products/admin/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    // Handle response
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        placeholder="Product Title"
        value={product.title}
        onChange={(e) => setProduct({...product, title: e.target.value})}
      />
      <textarea
        placeholder="Product Description"
        value={product.description}
        onChange={(e) => setProduct({...product, description: e.target.value})}
      />
      <input 
        placeholder="Price"
        type="number"
        step="0.01"
        value={product.price}
        onChange={(e) => setProduct({...product, price: e.target.value})}
      />
      <input 
        placeholder="Brand"
        value={product.brand}
        onChange={(e) => setProduct({...product, brand: e.target.value})}
      />
      <input 
        placeholder="Image URL"
        value={product.imageUrl}
        onChange={(e) => setProduct({...product, imageUrl: e.target.value})}
      />
      <input 
        placeholder="Fabric (e.g., 100% Cotton)"
        value={product.fabric}
        onChange={(e) => setProduct({...product, fabric: e.target.value})}
      />
      {/* Add more form fields */}
    </form>
  );
};
```

## 📸 Image Guidelines

### Recommended Image Specifications:
- **Aspect Ratio**: 2:3 (portrait) or 3:4 works best
- **Size**: At least 400x600 pixels
- **Format**: JPG or PNG
- **File Size**: Under 2MB for fast loading

### Image Hosting Services:

#### Free Options:
1. **Imgur**: 
   - Upload at [imgur.com](https://imgur.com/)
   - Get direct link (right-click → Copy image address)
   - Example: `https://i.imgur.com/abc123.jpg`

2. **Unsplash** (what we're currently using):
   - Find images at [unsplash.com](https://unsplash.com/)
   - Use their API URLs: `https://images.unsplash.com/photo-1234567890?w=400&h=600&fit=crop`

3. **Pexels**:
   - Similar to Unsplash
   - Free stock photos

#### Professional Options:
1. **Cloudinary**: 
   - Professional image hosting
   - Automatic resizing and optimization
   - Free tier available

2. **AWS S3**:
   - Upload images to S3 bucket
   - Use CloudFront for CDN

3. **Supabase Storage** (Recommended):
   - Built into your Supabase project
   - Automatic CDN and optimization
   - Easy integration with your existing setup

## 🧪 Testing Your Products

After adding products, test them:

1. **Search on your frontend**: Go to https://threadtwin.com and search for your product
2. **Use the API directly**: 
   ```bash
   curl "https://api.threadtwin.com/api/products/search?query=YourProduct"
   ```
3. **Check Supabase Dashboard**: View your products in the Table Editor

## 🎨 Customization Tips

### Product Tags
Use relevant tags to make your products discoverable:
- `['dress', 'casual', 'summer']`
- `['shirt', 'formal', 'business']`
- `['jeans', 'denim', 'casual']`

### Product Descriptions
Write detailed descriptions that include:
- Material/fabric information
- Fit and sizing details
- Care instructions
- Style suggestions

### Brand Consistency
Keep your brand name consistent across all products for better organization.

## 🚨 Important Notes

1. **Image URLs must be publicly accessible** - private or password-protected images won't work
2. **HTTPS URLs are recommended** for security
3. **Test your image URLs** in a browser before adding them
4. **Products are now stored in Supabase** - they persist across server restarts! 🎉
5. **Database schema**: Products are stored in the `products` table with fields mapped to your Product interface
6. **Fabric information is important** - Include detailed fabric/material descriptions for better product matching and user experience

## 🔧 Database Schema Reference

Your products are stored in the `products` table with these fields:
- `id` - Auto-incrementing primary key
- `title` - Product title
- `name` - Product name (same as title)
- `description` - Product description
- `price` - Decimal price
- `brand` - Brand name
- `image_url` - Main product image URL
- `image` - Alternative image field
- `url` - Product page URL
- `affiliate_link` - Affiliate link (same as URL)
- `fabric` - Fabric/material description
- `category` - Product category (first tag)
- `source` - Source identifier ('manual' for manually added)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## 🆘 Need Help?

If you run into issues:
1. Check the browser console for errors
2. Verify your image URLs work in a browser
3. Test the API endpoints with curl first
4. Check the backend logs for any errors
5. Verify your Supabase connection in the dashboard

## 🎉 Benefits of Supabase Integration

✅ **Persistent storage** - Products don't disappear on server restart  
✅ **Real-time updates** - Changes are immediately available  
✅ **Scalable** - Can handle thousands of products  
✅ **Searchable** - Full-text search across all fields  
✅ **Backup** - Automatic backups and version control  
✅ **Analytics** - Track product performance and usage  

Happy adding products to your Supabase database! 🚀 