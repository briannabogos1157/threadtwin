import express from 'express';
import { SkimlinksService } from '../services/skimlinks.service';

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const { query, limit } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const products = await SkimlinksService.searchProducts(
      query,
      limit ? parseInt(limit as string, 10) : undefined
    );

    // Wait for all affiliate links to be generated
    const resolvedProducts = await Promise.all(products);

    res.json({ products: resolvedProducts });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

export default router; 