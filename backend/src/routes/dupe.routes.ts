import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { findDupes, analyzeDupePair } from '../services/openai.service';
import { ProductSearchService } from '../services/serp.service';

dotenv.config();

const router = express.Router();
const productSearchService = new ProductSearchService();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Submit a new dupe
router.post('/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      originalProduct,
      dupeProduct,
      priceComparison,
      similarityReason
    } = req.body;

    // Validate required fields
    if (!originalProduct || !dupeProduct || !priceComparison || !similarityReason) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Insert into database
    const { data, error } = await supabase
      .from('dupes')
      .insert([
        {
          original_product: originalProduct,
          dupe_product: dupeProduct,
          price_comparison: priceComparison,
          similarity_reason: similarityReason
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Dupe submitted successfully', data });
  } catch (error: any) {
    console.error('Error submitting dupe:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all dupes (with optional status filter)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    let query = supabase.from('dupes').select('*');
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching dupes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update dupe status (for admin use)
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const { data, error } = await supabase
      .from('dupes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error updating dupe status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find dupes for a product using AI
router.post('/find-dupes', async (req: Request, res: Response): Promise<void> => {
  try {
    const { originalProduct } = req.body;

    if (!originalProduct) {
      res.status(400).json({ error: 'Original product is required' });
      return;
    }

    const suggestions = await findDupes(originalProduct);
    res.json({ suggestions });
  } catch (error: any) {
    console.error('Error finding dupes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get detailed comparison between original and dupe
router.post('/analyze-pair', async (req: Request, res: Response): Promise<void> => {
  try {
    const { originalProduct, dupeProduct } = req.body;

    if (!originalProduct || !dupeProduct) {
      res.status(400).json({ error: 'Both products are required' });
      return;
    }

    const analysis = await analyzeDupePair(originalProduct, dupeProduct);
    res.json(analysis);
  } catch (error: any) {
    console.error('Error analyzing dupe pair:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search for products
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string;
    
    if (!query) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    // Check if SERPAPI_KEY is available
    if (!process.env.SERPAPI_KEY) {
      console.error('SERPAPI_KEY not found in environment variables');
      res.status(401).json({ error: 'API key not configured', products: [] });
      return;
    }

    const searchResults = await productSearchService.search_dupes_via_serpapi(query);
    
    // Transform the results to match the frontend's expected format
    const products = searchResults.map((result, index) => ({
      id: `search-${index}`,
      title: result.title,
      description: result.snippet,
      price: 0, // Price not available in search results
      currency: 'USD',
      merchant: new URL(result.link).hostname.replace('www.', ''),
      imageUrl: '', // Image not available in basic search
      productUrl: result.link,
      affiliateUrl: result.link
    }));

    res.json({ products });
  } catch (error: any) {
    console.error('Error searching products:', error);
    // Check if the error is related to missing API key
    if (error.message?.includes('SERPAPI_KEY not found')) {
      res.status(401).json({ error: 'API key not configured', products: [] });
    } else {
      res.status(500).json({ error: error.message || 'Failed to search products', products: [] });
    }
  }
});

export default router; 