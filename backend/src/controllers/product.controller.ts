import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';

class ProductController {
  async importProducts(req: Request, res: Response) {
    try {
      const products = req.body;
      
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'Products must be an array' });
      }

      const result = await ProductService.importProducts(products);
      return res.json(result);
    } catch (error) {
      console.error('Error importing products:', error);
      return res.status(500).json({ 
        error: 'Failed to import products',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new ProductController(); 