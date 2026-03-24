import { Router } from 'express';
import cosineSimilarity from 'compute-cosine-similarity';
import {
  memoryEmbeddingCreate,
  memoryEmbeddingFindAll,
} from '../services/embeddingMemoryStore';

const router = Router();

router.post('/upload', async (req, res) => {
  const { imageUrl, brand, price, material, embedding } = req.body;

  if (!embedding || !imageUrl) {
    return res.status(400).json({ error: 'Missing embedding or imageUrl' });
  }

  if (!Array.isArray(embedding) || !embedding.every((num: unknown) => typeof num === 'number')) {
    return res.status(400).json({ error: 'Embedding must be an array of numbers' });
  }

  try {
    const result = memoryEmbeddingCreate({
      imageUrl,
      brand,
      price,
      material,
      embedding,
    });

    return res.status(200).json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Failed to save embedding:', err);
    return res.status(500).json({ error: 'Failed to save embedding', details: message });
  }
});

router.post('/find-similar', async (req, res) => {
  const { embedding } = req.body;

  if (!embedding) {
    return res.status(400).json({ error: 'Missing embedding' });
  }

  if (!Array.isArray(embedding) || !embedding.every((num: unknown) => typeof num === 'number')) {
    return res.status(400).json({ error: 'Embedding must be an array of numbers' });
  }

  try {
    const allEmbeddings = memoryEmbeddingFindAll();

    if (allEmbeddings.length === 0) {
      return res.status(200).json({
        message: 'No embeddings in memory (no database). Upload embeddings via POST /api/embedding/upload first.',
        count: 0,
        results: [],
      });
    }

    const similarities = allEmbeddings.map((item) => {
      const itemEmbedding = item.embedding as number[];
      const similarity = cosineSimilarity(embedding, itemEmbedding);
      return {
        ...item,
        similarity: similarity || 0,
        distance: 1 - (similarity || 0),
      };
    });

    const results = similarities
      .filter((row) => {
        const itemEmbedding = row.embedding as number[];
        return itemEmbedding.length === embedding.length;
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    return res.status(200).json(results);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Similarity search failed:', err);
    return res.status(500).json({ error: 'Similarity search failed', details: message });
  }
});

export default router;
