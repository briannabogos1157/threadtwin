const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupEmbeddings() {
  console.log('🧹 Starting embedding cleanup...');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Get all embeddings
    const allEmbeddings = await prisma.productEmbedding.findMany();
    console.log(`📊 Found ${allEmbeddings.length} embeddings in database`);
    
    const expectedDimension = 1536; // OpenAI embedding dimension
    const validEmbeddings = [];
    const invalidEmbeddings = [];
    
    // Check each embedding
    for (const embedding of allEmbeddings) {
      const embeddingArray = embedding.embedding;
      
      if (!Array.isArray(embeddingArray)) {
        console.log(`❌ Embedding ${embedding.id}: Not an array`);
        invalidEmbeddings.push({
          id: embedding.id,
          reason: 'Not an array',
          type: typeof embeddingArray
        });
        continue;
      }
      
      if (embeddingArray.length !== expectedDimension) {
        console.log(`❌ Embedding ${embedding.id}: Wrong dimension (${embeddingArray.length} vs ${expectedDimension})`);
        invalidEmbeddings.push({
          id: embedding.id,
          reason: 'Wrong dimension',
          actual: embeddingArray.length,
          expected: expectedDimension
        });
        continue;
      }
      
      // Check if all elements are numbers
      const hasNonNumbers = embeddingArray.some(val => typeof val !== 'number');
      if (hasNonNumbers) {
        console.log(`❌ Embedding ${embedding.id}: Contains non-numeric values`);
        invalidEmbeddings.push({
          id: embedding.id,
          reason: 'Contains non-numeric values'
        });
        continue;
      }
      
      validEmbeddings.push(embedding.id);
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Valid embeddings: ${validEmbeddings.length}`);
    console.log(`❌ Invalid embeddings: ${invalidEmbeddings.length}`);
    
    if (invalidEmbeddings.length > 0) {
      console.log('\n❌ Invalid embeddings details:');
      invalidEmbeddings.forEach(item => {
        console.log(`  - ID: ${item.id}, Reason: ${item.reason}`);
        if (item.actual) {
          console.log(`    Actual: ${item.actual}, Expected: ${item.expected}`);
        }
        if (item.type) {
          console.log(`    Type: ${item.type}`);
        }
      });
      
      console.log('\n💡 To fix invalid embeddings:');
      console.log('1. Delete invalid embeddings:');
      console.log('   await prisma.productEmbedding.deleteMany({');
      console.log('     where: { id: { in: [invalid_ids_here] } }');
      console.log('   });');
      console.log('\n2. Or regenerate embeddings with correct dimensions');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
  }
}

// Run the cleanup
cleanupEmbeddings()
  .then(() => {
    console.log('✅ Cleanup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }); 