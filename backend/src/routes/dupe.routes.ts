import express from 'express';
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
router.post('/submit', async (req, res) => {
  try {
    const {
      originalProduct,
      dupeProduct,
      priceComparison,
      similarityReason
    } = req.body;

    // Validate required fields
    if (!originalProduct || !dupeProduct || !priceComparison || !similarityReason) {
      return res.status(400).json({ error: 'All fields are required' });
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
router.get('/', async (req, res) => {
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
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
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
router.post('/find', async (req, res) => {
  try {
    const { 
      originalProduct, 
      priceRange, 
      preferredStores 
    } = req.body;

    if (!originalProduct) {
      return res.status(400).json({ error: 'Original product is required' });
    }

    const suggestions = await findDupes(originalProduct, priceRange, preferredStores);
    res.json({ suggestions });
  } catch (error: any) {
    console.error('Error finding dupes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get detailed comparison between original and dupe
router.post('/analyze-pair', async (req, res) => {
  try {
    const { originalProduct, dupeProduct } = req.body;

    if (!originalProduct || !dupeProduct) {
      return res.status(400).json({ error: 'Both products are required' });
    }

    const analysis = await analyzeDupePair(originalProduct, dupeProduct);
    res.json(analysis);
  } catch (error: any) {
    console.error('Error analyzing dupe pair:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 