import express from 'express';
import { SkimlinksService } from '../services/skimlinks.service';

const router = express.Router();

// Test endpoint that returns a sample product
router.get('/test', async (_req, res) => {
  try {
    const sampleProduct = {
      id: 'skims-cotton-rib-tank',
      title: 'SKIMS Cotton Rib Long Tank - Harbor',
      description: 'The selfie-worthy cotton tank you know and love, now with a longer length that hits at the top part of the hip. Features a ribbed finish plus the perfect amount of stretch and breathability for major comfort. Fits true to size.',
      price: 38.00,
      currency: 'USD',
      merchant: 'SKIMS',
      imageUrl: 'https://cdn.shopify.com/s/files/1/0259/5448/4284/products/SKIMS-COTTON-RIB-LONG-TANK-HARBOR-01-ECOM.jpg',
      productUrl: 'https://skims.com/products/cotton-rib-long-tank-harbor',
      affiliateUrl: 'https://skims.com/products/cotton-rib-long-tank-harbor'  // This will be replaced with actual affiliate link in production
    };

    res.json({ products: [sampleProduct] });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Test endpoint failed' });
  }
});

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