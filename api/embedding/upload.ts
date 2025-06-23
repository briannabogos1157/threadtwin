import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
  } catch (err: any) {
    console.error("❌ Failed to save embedding:", err);
    return res.status(500).json({ error: 'Failed to save embedding', details: err.message });
  }
} 