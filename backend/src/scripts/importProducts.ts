import { sequelize } from '../config/database';
import productImportService from '../services/productImport.service';

const productsToImport = [
  {
    id: '7996937',
    brand: 'Wit & Wisdom',
    title: "Logan 'Ab'Solution High Waist Ankle Slim Straight Leg Jeans",
    currencyCode: 'USD',
    price: 78,
    retailPrice: 78,
    averageRating: 3.7,
    totalReviews: 9,
    endDate: '2025-06-01T16:45:12'
  },
  {
    id: '6914656',
    brand: 'AG',
    title: 'AG Tellis Cloud Soft Slim Fit Jeans',
    currencyCode: 'USD',
    price: 198,
    retailPrice: 198,
    averageRating: 4.5,
    totalReviews: 59,
    endDate: '2025-06-01T16:45:38'
  }
];

async function importProducts() {
  try {
    await sequelize.sync();
    const results = await productImportService.importBulkProducts(productsToImport);
    console.log('Import results:', results);
  } catch (error) {
    console.error('Error importing products:', error);
  } finally {
    await sequelize.close();
  }
}

// Only run if this file is being run directly
if (require.main === module) {
  importProducts();
} 