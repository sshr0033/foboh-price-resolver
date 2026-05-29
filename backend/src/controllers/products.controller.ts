import type { Request, Response, NextFunction } from 'express';
import { getProduct, listProducts } from '../services/products.service.js';

export function getProductsHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const { q, subCategory, segment, brand, includeDeleted } = req.query;
    const items = listProducts({
      q: typeof q === 'string' ? q : undefined,
      subCategory: typeof subCategory === 'string' ? subCategory : undefined,
      segment: typeof segment === 'string' ? segment : undefined,
      brand: typeof brand === 'string' ? brand : undefined,
      includeDeleted: includeDeleted === 'true',
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export function getProductHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing id' });
      return;
    }
    res.json(getProduct(id));
  } catch (err) {
    next(err);
  }
}
