import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { findDupes, analyzeDupePair } from '../services/openai.service';

dotenv.config();

const router = express.Router();

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
    const { status, page = '1', sortBy = 'created_at', sortOrder = 'desc', search = '' } = req.query;
    const pageNumber = parseInt(page as string);
    const itemsPerPage = 10;
    const offset = (pageNumber - 1) * itemsPerPage;

    let query = supabase.from('dupes').select('*', { count: 'exact' });
    
    if (status) {
      query = query.eq('status', status);
    }

    // Add search functionality
    if (search) {
      query = query.or(`original_product.ilike.%${search}%,dupe_product.ilike.%${search}%,similarity_reason.ilike.%${search}%`);
    }

    // Add sorting
    query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });

    // Add pagination
    query = query.range(offset, offset + itemsPerPage - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      items: data,
      total: count,
      page: pageNumber,
      totalPages: Math.ceil((count || 0) / itemsPerPage)
    });
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

    // Return empty results for now since we're not using SERP API
    res.json({ products: [] });
  } catch (error: any) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: error.message || 'Failed to search products', products: [] });
  }
});

// Bulk update dupe statuses
router.patch('/bulk-update', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'No IDs provided' });
      return;
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const { data, error } = await supabase
      .from('dupes')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .in('id', ids)
      .select();

    if (error) throw error;

    res.json({ 
      message: `Successfully updated ${data.length} submissions`,
      data 
    });
  } catch (error: any) {
    console.error('Error performing bulk update:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 