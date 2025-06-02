import express from 'express';
import { ProductService } from '../services/product.service';
import productController from '../controllers/product.controller';

const router = express.Router();

// Get all affiliate products
router.get('/affiliate', async (_req, res) => {
  try {
    const products = await ProductService.getAllProducts();
    return res.json(products);
  } catch (error) {
    console.error('Error fetching affiliate products:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch affiliate products',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a new affiliate product
router.post('/affiliate', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const product = await ProductService.addAffiliateProduct(url);
    return res.json(product);
  } catch (error) {
    console.error('Error adding affiliate product:', error);
    return res.status(500).json({ 
      error: 'Failed to add affiliate product',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/import', productController.importProducts);

export default router; 