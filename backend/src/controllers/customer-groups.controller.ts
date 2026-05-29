import type { Request, Response, NextFunction } from 'express';
import { listGroups } from '../services/customers.service.js';

export function getGroupsHandler(_req: Request, res: Response, next: NextFunction): void {
  try {
    res.json({ items: listGroups() });
  } catch (err) {
    next(err);
  }
}
