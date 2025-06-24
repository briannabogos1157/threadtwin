import { PrismaClient } from '@prisma/client';
import cosineSimilarity from 'compute-cosine-similarity';

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

    if (!Array.isArray(embedding) || !embedding.every(num => typeof num === 'number')) {
      console.log('❌ Invalid embedding format');
      return res.status(400).json({ error: 'Embedding must be an array of numbers' });
    }

    console.log(`📦 Input embedding dimensions: ${embedding.length}`);

    console.log('🔍 Testing database connection...');
    
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      
      // Get count of embeddings
      const count = await prisma.productEmbedding.count();
      console.log(`📊 Found ${count} products in database`);
      
      if (count === 0) {
        console.log('⚠️ No products found in database');
        return res.status(200).json({ 
          message: 'No products found in database',
          count: 0,
          results: [] 
        });
      }
      
      // Get all embeddings from database
      const allEmbeddings = await prisma.productEmbedding.findMany();
      console.log(`📊 Retrieved ${allEmbeddings.length} products from database`);
      
      // Calculate similarity for each embedding
      console.log('🧮 Calculating similarities...');
      const similarities = allEmbeddings.map(item => {
        const itemEmbedding = item.embedding as number[];
        console.log(`📊 Item ${item.id} embedding dimensions: ${itemEmbedding.length}`);
        
        // Check if dimensions match
        if (itemEmbedding.length !== embedding.length) {
          console.log(`⚠️ Dimension mismatch: input=${embedding.length}, stored=${itemEmbedding.length}`);
          return {
            id: item.id,
            imageUrl: item.imageUrl,
            brand: item.brand,
            price: item.price,
            material: item.material,
            similarity: 0,
            distance: 1,
            error: `Dimension mismatch: ${embedding.length} vs ${itemEmbedding.length}`
          };
        }
        
        try {
          const similarity = cosineSimilarity(embedding, itemEmbedding);
          return {
            id: item.id,
            imageUrl: item.imageUrl,
            brand: item.brand,
            price: item.price,
            material: item.material,
            similarity: similarity || 0,
            distance: 1 - (similarity || 0)
          };
        } catch (calcError) {
          console.error(`❌ Similarity calculation error for item ${item.id}:`, calcError);
          return {
            id: item.id,
            imageUrl: item.imageUrl,
            brand: item.brand,
            price: item.price,
            material: item.material,
            similarity: 0,
            distance: 1,
            error: calcError.message
          };
        }
      });

      // Filter out items with errors and sort by similarity (highest first)
      const validResults = similarities.filter(item => !item.error);
      const results = validResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      console.log(`✅ Found ${results.length} similar products (${validResults.length} valid, ${similarities.length - validResults.length} with errors)`);
      if (results.length > 0) {
        console.log('🏆 Top match similarity:', results[0]?.similarity);
      }

      return res.status(200).json({
        message: 'Similar products found',
        count: results.length,
        totalValid: validResults.length,
        totalWithErrors: similarities.length - validResults.length,
        results: results
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
      error: 'Similarity search failed', 
      details: err.message 
    });
  }
} 