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

export default router; 