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
    const products = await ProductService.getAllProducts();
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

// Single product by id (numeric)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const product = await ProductService.getProductDetails(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    console.error('[ProductRoutes] Error fetching product:', error);
    return res.status(500).json({
      error: 'Failed to fetch product',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Admin: Add new product (disabled — catalog comes from Manus only)
router.post('/admin/add', async (_req, res) => {
  return res.status(501).json({
    error: 'Not supported',
    message: 'Products are sourced from Manus on demand; there is no database catalog to add to.',
  });
});

export default router; 