import { db } from '../store/index.js';
import { HttpError } from '../utils/errors.js';
import type { Product } from '../types.js';

export type ListProductsArgs = {
  q?: string;
  subCategory?: string;
  segment?: string;
  brand?: string;
  includeDeleted?: boolean;
};

export function listProducts(args: ListProductsArgs): Product[] {
  const q = args.q?.trim().toLowerCase() ?? '';
  return db.products.list().filter((p) => {
    if (!args.includeDeleted && p.isDeleted) return false;
    if (q && !p.title.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    if (args.subCategory && p.subCategory !== args.subCategory) return false;
    if (args.segment && p.segment !== args.segment) return false;
    if (args.brand && p.brand !== args.brand) return false;
    return true;
  });
}

export function getProduct(id: string): Product {
  const p = db.products.get(id);
  if (!p) throw new HttpError(404, 'Product not found');
  if (p.isDeleted) throw new HttpError(410, 'Product has been deleted');
  return p;
}

/** Internal lookup that allows deleted products (resolver needs this read but will skip them on match). */
export function getProductRaw(id: string): Product | undefined {
  return db.products.get(id);
}
