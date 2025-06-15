import express from 'express';
import { ProductService } from '../services/product.service';

const router = express.Router();

// Initialize the product service
ProductService.initialize();

// Get all products
router.get('/', async (_req, res) => {
  try {
    const products = ProductService.getAllProducts();
    return res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
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
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const products = await ProductService.searchProducts(query);
    return res.json({ products });
  } catch (error) {
    console.error('Error searching products:', error);
    return res.status(500).json({ 
      error: 'Failed to search products',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 