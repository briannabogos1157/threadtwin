import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    console.log('🔍 Testing database connection...');
    
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      
      // Just get the count to test the connection
      const count = await prisma.productEmbedding.count();
      console.log(`📊 Found ${count} products in database`);
      
      return res.status(200).json({
        message: 'Database connection successful',
        count: count,
        embeddingReceived: true,
        dimensions: Array.isArray(embedding) ? embedding.length : 0
      });
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return res.status(500).json({ 
        error: 'Database connection failed', 
        details: dbError.message 
      });
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (err) {
    console.error('❌ Find Similar API error:', err);
    return res.status(500).json({ 
      error: 'API failed', 
      details: err.message 
    });
  }
} 