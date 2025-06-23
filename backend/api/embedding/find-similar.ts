import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import cosineSimilarity from 'compute-cosine-similarity';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
  } catch (err: any) {
    console.error("❌ Similarity search failed:", err);
    return res.status(500).json({ error: 'Similarity search failed', details: err.message });
  }
} 