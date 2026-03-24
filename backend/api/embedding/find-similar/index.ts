import cosineSimilarity from 'compute-cosine-similarity';

type EmbeddingRow = {
  id: string;
  imageUrl: string;
  brand?: string | null;
  price?: number | null;
  material?: string | null;
  embedding: number[];
};

declare global {
  // eslint-disable-next-line no-var
  var __threadTwinEmbeddingStore: EmbeddingRow[] | undefined;
}

function getEmbeddingStore(): EmbeddingRow[] {
  if (!globalThis.__threadTwinEmbeddingStore) {
    globalThis.__threadTwinEmbeddingStore = [];
  }
  return globalThis.__threadTwinEmbeddingStore;
}

export default async function handler(req: { method?: string; body?: { embedding?: number[] } }, res: {
  status: (n: number) => { json: (b: unknown) => void };
}) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { embedding } = req.body || {};

    if (!embedding) {
      return res.status(400).json({ error: 'Missing embedding' });
    }

    if (!Array.isArray(embedding) || !embedding.every((num) => typeof num === 'number')) {
      return res.status(400).json({ error: 'Embedding must be an array of numbers' });
    }

    const allEmbeddings = getEmbeddingStore();

    if (allEmbeddings.length === 0) {
      return res.status(200).json({
        message: 'No embeddings in memory (no database).',
        count: 0,
        results: [],
      });
    }

    const similarities: Array<EmbeddingRow & { similarity: number; distance: number }> = [];

    for (const item of allEmbeddings) {
      const itemEmbedding = item.embedding as number[];
      if (itemEmbedding.length !== embedding.length) continue;
      const similarity = cosineSimilarity(embedding, itemEmbedding);
      similarities.push({
        ...item,
        similarity: similarity || 0,
        distance: 1 - (similarity || 0),
      });
    }

    const results = similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 5);

    return res.status(200).json({
      message: 'Similar products found',
      count: results.length,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({
      error: 'Similarity search failed',
      details: message,
    });
  }
}
