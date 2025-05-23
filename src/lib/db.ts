import { prisma } from './prisma';

export async function validateDatabaseConnection() {
  try {
    await prisma.$connect();
    
    // Try a simple query to verify connection
    await prisma.product.count();
    
    return true;
  } catch (error) {
    console.error('Database connection validation failed:', error);
    return false;
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

// Helper function to handle database errors
export function handleDatabaseError(error: unknown) {
  if (error instanceof Error) {
    console.error('Database error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } else {
    console.error('Unknown database error:', error);
  }
} 