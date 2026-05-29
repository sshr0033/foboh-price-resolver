import type { Request, Response, NextFunction } from 'express';
import { previewSchema } from '../schemas/profile.js';
import { previewPrices } from '../services/preview.service.js';
import { resolvePrice } from '../services/pricing-resolver.service.js';
import { HttpError } from '../utils/errors.js';

export function previewHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const parsed = previewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid preview body', details: parsed.error.format() });
      return;
    }
    res.json({ items: previewPrices(parsed.data) });
  } catch (err) {
    next(err);
  }
}

export function resolveHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const { customerId, productId } = req.query;
    if (typeof customerId !== 'string' || typeof productId !== 'string') {
      throw new HttpError(400, 'customerId and productId query params are required');
    }
    res.json(resolvePrice(customerId, productId));
  } catch (err) {
    next(err);
  }
}
