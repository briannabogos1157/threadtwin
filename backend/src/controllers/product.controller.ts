import { Request, Response } from 'express';
import productImportService from '../services/productImport.service';

export class ProductController {
  async importProducts(req: Request, res: Response) {
    try {
      const productsData = req.body;
      
      if (!Array.isArray(productsData)) {
        return res.status(400).json({
          success: false,
          error: 'Request body must be an array of products'
        });
      }

      const results = await productImportService.importBulkProducts(productsData);
      
      return res.status(200).json({
        success: true,
        results
      });
    } catch (error) {
      console.error('Error in importProducts controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export default new ProductController(); 