import { Router } from 'express';
import prisma from '../config/database';
import cosineSimilarity from 'compute-cosine-similarity';

const router = Router();

// Upload embedding route
router.post('/upload', async (req, res) => {
  const { imageUrl, brand, price, material, embedding } = req.body;

  if (!embedding || !imageUrl) {
    return res.status(400).json({ error: 'Missing embedding or imageUrl' });
  }

  // Validate that embedding is an array of numbers
  if (!Array.isArray(embedding) || !embedding.every(num => typeof num === 'number')) {
    return res.status(400).json({ error: 'Embedding must be an array of numbers' });
  }

  try {
    const result = await prisma.productEmbedding.create({
      data: {
        imageUrl,
        brand,
        price,
        material,
        embedding, // Ensure your schema accepts this as `Float[]`
      },
    });

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("❌ Failed to save embedding:", err);
    return res.status(500).json({ error: 'Failed to save embedding', details: err.message });
  }
});

// Find similar products route
router.post('/find-similar', async (req, res) => {
  const { embedding } = req.body;

  if (!embedding) {
    return res.status(400).json({ error: 'Missing embedding' });
  }

  if (!Array.isArray(embedding) || !embedding.every(num => typeof num === 'number')) {
    return res.status(400).json({ error: 'Embedding must be an array of numbers' });
  }

  try {
    // Get all embeddings from database
    const allEmbeddings = await prisma.productEmbedding.findMany();
    
    // Calculate similarity for each embedding
    const similarities = allEmbeddings.map(item => {
      const itemEmbedding = item.embedding as number[];
      const similarity = cosineSimilarity(embedding, itemEmbedding);
      return {
        ...item,
        similarity: similarity || 0,
        distance: 1 - (similarity || 0) // Convert similarity to distance
      };
    });

    // Sort by similarity (highest first) and return top 5
    const results = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Similarity search failed:", err);
    return res.status(500).json({ error: 'Similarity search failed', details: err.message });
  }
});

export default router; 