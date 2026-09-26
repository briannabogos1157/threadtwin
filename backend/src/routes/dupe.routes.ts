import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { analyzeDupePair } from '../services/openai.service';
import { isManusConfigured } from '../services/manus.service';
import {
  isDupeSearchUnavailable,
  normalizeSearchProduct,
  readDupeSearch,
  startDupeSearch,
} from '../services/dupeSearch';
import {
  insertDupe,
  listDupes,
  updateDupeStatus,
  bulkUpdateStatus,
} from '../services/dupeStore';

dotenv.config();

const router = express.Router();

function unavailable(res: Response): void {
  res.status(503).json({ error: 'Dupe search is temporarily unavailable' });
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

async function findFromBody(body: unknown, res: Response): Promise<void> {
  const product = normalizeSearchProduct(body);
  if (!product) {
    res.status(400).json({ error: 'An analyzed product is required' });
    return;
  }
  if (!isManusConfigured()) {
    unavailable(res);
    return;
  }

  try {
    const job = await startDupeSearch(product);
    console.log('Dupe search accepted:', job.searchId);
    res.status(202).json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find dupes';
    console.error('Error finding dupes:', message);
    if (isDupeSearchUnavailable(message)) {
      unavailable(res);
      return;
    }
    res.status(502).json({ error: 'Dupe search is temporarily unavailable' });
  }
}

router.get('/find/:searchId', async (req: Request, res: Response): Promise<void> => {
  const searchId = String(req.params.searchId || '');
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(searchId)) {
    res.status(404).json({ error: 'Dupe search is temporarily unavailable' });
    return;
  }
  try {
    const job = await readDupeSearch(searchId);
    if (!job) {
      res.status(404).json({ error: 'Dupe search is temporarily unavailable' });
      return;
    }
    res.json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read dupe search';
    console.error('Error reading dupe search:', message);
    res.status(502).json({ error: 'Dupe search is temporarily unavailable' });
  }
});

// Find dupes from an analyzed product. A typed luxury item is accepted as a name-only product.
router.post('/find', async (req: Request, res: Response): Promise<void> => {
  const body = req.body?.product
    ? req.body
    : { product: { name: req.body?.luxuryItem || req.body?.originalProduct || '' } };
  await findFromBody(body, res);
});

router.post('/find-dupes', async (req: Request, res: Response): Promise<void> => {
  const body = req.body?.product
    ? req.body
    : { product: { name: req.body?.originalProduct || req.body?.luxuryItem || '' } };
  await findFromBody(body, res);
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
