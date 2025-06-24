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

    console.log('✅ Basic validation passed');
    console.log(`📦 Embedding dimensions: ${embedding.length}`);

    // Return a simple test response
    return res.status(200).json({
      message: 'Basic endpoint test successful',
      embeddingReceived: true,
      dimensions: embedding.length,
      results: []
    });
    
  } catch (err) {
    console.error('❌ Find Similar API error:', err);
    return res.status(500).json({ 
      error: 'Similarity search failed', 
      details: err.message 
    });
  }
} 