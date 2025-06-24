const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteInvalidEmbeddings() {
  console.log('🗑️ Starting deletion of invalid embeddings...');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Delete the specific invalid embeddings we found
    const invalidIds = [
      '74c1ba76-84ff-4b13-a3fa-718b8ee78f2c',
      'a6d03bd3-6d10-406e-b00c-df242dbe16ef'
    ];
    
    const result = await prisma.productEmbedding.deleteMany({
      where: {
        id: {
          in: invalidIds
        }
      }
    });
    
    console.log(`✅ Deleted ${result.count} invalid embeddings`);
    
    // Verify deletion
    const remainingCount = await prisma.productEmbedding.count();
    console.log(`📊 Remaining embeddings: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('✅ Database is now clean - no embeddings remaining');
    }
    
  } catch (error) {
    console.error('❌ Error during deletion:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
  }
}

// Run the deletion
deleteInvalidEmbeddings()
  .then(() => {
    console.log('✅ Deletion completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Deletion failed:', error);
    process.exit(1);
  }); 