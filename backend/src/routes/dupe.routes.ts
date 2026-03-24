import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { findDupes, analyzeDupePair } from '../services/openai.service';
import { findDupesWithManus, isManusConfigured } from '../services/manus.service';
import {
  insertDupe,
  listDupes,
  updateDupeStatus,
  bulkUpdateStatus,
} from '../services/dupeStore';

dotenv.config();

const router = express.Router();

async function resolveDupeMatches(query: string): Promise<
  { title: string; retailer: string; price: string; description: string; link: string }[]
> {
  const q = query.trim();
  if (!q) return [];

  if (isManusConfigured()) {
    return findDupesWithManus(q);
  }

  const openaiDupes = await findDupes(q);
  return openaiDupes.map((d) => ({
    title: d.title,
    retailer: d.retailer,
    price: d.price,
    description: d.description,
    link: d.productLink,
  }));
}

// Submit a new dupe
router.post('/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      originalProduct,
      dupeProduct,
      priceComparison,
      similarityReason,
    } = req.body;

    if (!originalProduct || !dupeProduct || !priceComparison || !similarityReason) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const row = insertDupe({
      original_product: originalProduct,
      dupe_product: dupeProduct,
      price_comparison: priceComparison,
      similarity_reason: similarityReason,
    });

    res.status(201).json({ message: 'Dupe submitted successfully', data: [row] });
  } catch (error: any) {
    console.error('Error submitting dupe:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all dupes (with optional status filter)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = '1', sortBy = 'created_at', sortOrder = 'desc', search = '' } = req.query;
    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const itemsPerPage = 10;

    const result = listDupes({
      status: status as string | undefined,
      page: pageNumber,
      itemsPerPage,
      sortBy: sortBy as string,
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
      search: (search as string) || '',
    });

    res.json({
      items: result.items,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
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

    const data = updateDupeStatus(id, status);
    if (data.length === 0) {
      res.status(404).json({ error: 'Dupe not found' });
      return;
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error updating dupe status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find dupes (Next.js DupeFinder and API gateway use this path)
router.post('/find', async (req: Request, res: Response): Promise<void> => {
  try {
    const luxuryItem = (req.body.luxuryItem || req.body.originalProduct || '') as string;

    if (!luxuryItem?.trim()) {
      res.status(400).json({ error: 'luxuryItem is required' });
      return;
    }

    const matches = await resolveDupeMatches(luxuryItem);
    res.json(matches);
  } catch (error: any) {
    console.error('Error finding dupes:', error);
    res.status(500).json({ error: error.message || 'Failed to find dupes' });
  }
});

// Find dupes for a product using AI (legacy body key)
router.post('/find-dupes', async (req: Request, res: Response): Promise<void> => {
  try {
    const luxuryItem = (req.body.originalProduct || req.body.luxuryItem || '') as string;

    if (!luxuryItem?.trim()) {
      res.status(400).json({ error: 'Original product is required' });
      return;
    }

    const matches = await resolveDupeMatches(luxuryItem);
    res.json(matches);
  } catch (error: any) {
    console.error('Error finding dupes:', error);
    res.status(500).json({ error: error.message || 'Failed to find dupes' });
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

    const data = bulkUpdateStatus(ids, status);

    res.json({
      message: `Successfully updated ${data.length} submissions`,
      data,
    });
  } catch (error: any) {
    console.error('Error performing bulk update:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
