import type { Request, Response, NextFunction } from 'express';
import { listCustomers } from '../services/customers.service.js';

export function getCustomersHandler(_req: Request, res: Response, next: NextFunction): void {
  try {
    res.json({ items: listCustomers() });
  } catch (err) {
    next(err);
  }
}
