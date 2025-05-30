import express from 'express';
import { SkimlinksService } from '../services/skimlinks.service';

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    console.log('Received search request:', req.query);
    const { query, limit } = req.query;
    
    if (!query || typeof query !== 'string') {
      console.log('Invalid query:', query);
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log('Searching Skimlinks with query:', query);
    
    // First validate credentials
    try {
      await SkimlinksService.validateCredentials();
      console.log('Skimlinks credentials validated successfully');
    } catch (error) {
      console.error('Skimlinks credential validation failed:', error);
      return res.status(401).json({ error: 'Failed to authenticate with Skimlinks' });
    }

    const products = await SkimlinksService.searchProducts(
      query,
      limit ? parseInt(limit as string, 10) : undefined
    );

    console.log(`Found ${products.length} products before resolving affiliate links`);

    // Wait for all affiliate links to be generated
    const resolvedProducts = await Promise.all(products);
    console.log(`Successfully processed ${resolvedProducts.length} products with affiliate links`);

    res.json({ products: resolvedProducts });
  } catch (error) {
    console.error('Search error details:', error);
    res.status(500).json({ 
      error: 'Failed to search products',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 