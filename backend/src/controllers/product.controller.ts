import { Request, Response } from 'express';

class ProductController {
  async importProducts(_req: Request, res: Response) {
    return res.status(501).json({
      error: 'Product import is disabled',
      message: 'Catalog is powered by Manus; there is no database import.',
    });
  }
}

export default new ProductController();
