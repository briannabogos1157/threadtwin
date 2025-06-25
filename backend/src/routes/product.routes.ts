import express from 'express';
import { ProductService } from '../services/product.service';

const router = express.Router();

// Initialize the product service
console.log('[ProductRoutes] Initializing product service...');
ProductService.initialize();

// Get all products
router.get('/', async (_req, res) => {
  try {
    console.log('[ProductRoutes] Fetching all products...');
    const products = ProductService.getAllProducts();
    console.log(`[ProductRoutes] Found ${products.length} products`);
    return res.json(products);
  } catch (error) {
    console.error('[ProductRoutes] Error fetching products:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search products
router.get('/search', async (req, res) => {
  try {
    const query = req.query.query as string;
    console.log(`[ProductRoutes] Search request received for query: "${query}"`);
    
    if (!query) {
      console.log('[ProductRoutes] No query provided');
      return res.status(400).json({ error: 'Search query is required' });
    }

    const products = await ProductService.searchProducts(query);
    console.log(`[ProductRoutes] Search completed, found ${products.length} products`);
    return res.json({ products });
  } catch (error) {
    console.error('[ProductRoutes] Error searching products:', error);
    return res.status(500).json({ 
      error: 'Failed to search products',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Admin: Add new product
router.post('/admin/add', async (req, res) => {
  try {
    const { title, description, price, currency, brand, imageUrl, productUrl, tags, fabric } = req.body;
    
    console.log('[ProductRoutes] Adding new product:', { title, brand, price });
    
    // Validate required fields
    if (!title || !description || !price || !brand || !imageUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, description, price, brand, imageUrl' 
      });
    }

    const newProduct = ProductService.addProduct({
      title,
      description,
      price: price.toString(),
      currency: currency || 'USD',
      brand,
      imageUrl,
      productUrl: productUrl || imageUrl,
      tags: tags || [],
      fabric: fabric || 'Unknown'
    });

    console.log('[ProductRoutes] Product added successfully:', newProduct.id);
    return res.status(201).json({ 
      success: true, 
      product: newProduct,
      message: 'Product added successfully' 
    });
  } catch (error) {
    console.error('[ProductRoutes] Error adding product:', error);
    return res.status(500).json({ 
      error: 'Failed to add product',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 