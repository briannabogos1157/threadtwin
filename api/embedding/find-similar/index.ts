import cosineSimilarity from 'compute-cosine-similarity';

export default async function handler(req, res) {
  console.log('🔍 Find Similar API called');
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { embedding } = req.body;
    console.log('📥 Received embedding request');

    if (!embedding) {
      console.log('❌ Missing embedding in request');
      return res.status(400).json({ error: 'Missing embedding' });
    }

    if (!Array.isArray(embedding) || !embedding.every(num => typeof num === 'number')) {
      console.log('❌ Invalid embedding format');
      return res.status(400).json({ error: 'Embedding must be an array of numbers' });
    }

    console.log('🧮 Testing cosine similarity calculation...');
    
    // Test with a dummy embedding to verify the function works
    const testEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
    const similarity = cosineSimilarity(embedding.slice(0, 5), testEmbedding);
    
    console.log('✅ Cosine similarity calculation successful');

    return res.status(200).json({
      message: 'Find similar API is working!',
      testSimilarity: similarity,
      receivedEmbeddingLength: embedding.length,
      note: 'Database connection will be added next'
    });
    
  } catch (err) {
    console.error('❌ Find Similar API error:', err);
    return res.status(500).json({ 
      error: 'Similarity search failed', 
      details: err.message 
    });
  }
} 