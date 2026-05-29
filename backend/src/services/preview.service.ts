import { db } from '../store/index.js';
import { HttpError } from '../utils/errors.js';
import type { PreviewLine } from '../types.js';
import type { PreviewInput } from '../schemas/profile.js';
import { applyOverride } from './pricing-resolver.service.js';
import { round2 } from '../utils/round.js';

export function previewPrices(input: PreviewInput): PreviewLine[] {
  const out: PreviewLine[] = [];
  for (const id of input.productIds) {
    const product = db.products.get(id);
    if (!product) throw new HttpError(400, `Product not found: ${id}`);
    if (product.isDeleted) throw new HttpError(400, `Product is deleted: ${id}`);
    const { price, clamped } = applyOverride(product.basePrice, input.priceOverride);
    out.push({
      productId: product.id,
      basePrice: round2(product.basePrice),
      newPrice: price,
      clamped,
    });
  }
  return out;
}
