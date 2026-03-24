/** @deprecated Database import removed; catalog is Manus-backed. */

export class ProductImportService {
  async importProduct(): Promise<never> {
    throw new Error('Database import removed; use Manus-backed /api/products.');
  }

  async importSimplifiedProduct(): Promise<never> {
    throw new Error('Database import removed; use Manus-backed /api/products.');
  }

  async importBulkProducts(): Promise<never> {
    throw new Error('Database import removed; use Manus-backed /api/products.');
  }
}

export default new ProductImportService();
