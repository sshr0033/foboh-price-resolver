import { db } from '../store/index.js';
import { HttpError } from '../utils/errors.js';
import { round2 } from '../utils/round.js';
import type {
  ConsideredProfile,
  Customer,
  PriceOverride,
  PricingProfile,
  Product,
  ResolveResult,
} from '../types.js';
import { getCustomer } from './customers.service.js';

function customerScopeMatches(profile: PricingProfile, customer: Customer): boolean {
  const cs = profile.customerScope;
  if (cs.type === 'ALL') return true;
  if (cs.type === 'CUSTOMER') return cs.customerId === customer.id;
  return customer.groupIds.includes(cs.groupId);
}

function productScopeMatches(profile: PricingProfile, product: Product): boolean {
  if (product.isDeleted) return false;
  const ps = profile.productScope;
  if (ps.type === 'ALL') return true;
  if (ps.type === 'PRODUCT_LIST') return ps.productIds.includes(product.id);
  const f = ps.filters;
  if (f.subCategory && f.subCategory !== product.subCategory) return false;
  if (f.brand && f.brand !== product.brand) return false;
  if (f.segment && f.segment !== product.segment) return false;
  return true;
}

function customerScore(profile: PricingProfile): number {
  switch (profile.customerScope.type) {
    case 'CUSTOMER':
      return 3;
    case 'GROUP':
      return 2;
    case 'ALL':
      return 1;
  }
}

function productScore(profile: PricingProfile): number {
  switch (profile.productScope.type) {
    case 'PRODUCT_LIST':
      return 3;
    case 'RULE':
      return 2;
    case 'ALL':
      return 1;
  }
}

export function applyOverride(
  basePrice: number,
  override: PriceOverride,
): { price: number; clamped: boolean; detail: string } {
  let raw: number;
  let detail: string;
  if (override.type === 'CUSTOM_PRICE') {
    raw = override.price;
    detail = `Custom price $${override.price.toFixed(2)} used.`;
  } else {
    const { mode, direction, value } = override.adjustment;
    const delta = mode === 'FIXED' ? value : (basePrice * value) / 100;
    raw = direction === 'INCREASE' ? basePrice + delta : basePrice - delta;
    const sign = direction === 'INCREASE' ? '+' : '−';
    const unit = mode === 'FIXED' ? `$${value.toFixed(2)}` : `${value}%`;
    detail = `${mode} adjustment ${sign}${unit} applied to base $${basePrice.toFixed(2)}.`;
  }
  const clamped = raw < 0;
  const floored = Math.max(raw, 0);
  return { price: round2(floored), clamped, detail };
}

function describeScope(profile: PricingProfile): string {
  const c =
    profile.customerScope.type === 'CUSTOMER'
      ? 'specific customer'
      : profile.customerScope.type === 'GROUP'
        ? 'group'
        : 'all customers';
  const p =
    profile.productScope.type === 'PRODUCT_LIST'
      ? 'product list'
      : profile.productScope.type === 'RULE'
        ? 'rule'
        : 'all products';
  return `customer: ${c}, product: ${p}`;
}

export function resolvePrice(customerId: string, productId: string): ResolveResult {
  const customer = getCustomer(customerId);
  const product = db.products.get(productId);
  if (!product) throw new HttpError(404, 'Product not found');
  if (product.isDeleted) throw new HttpError(410, 'Product has been deleted');

  const matched: Array<{ profile: PricingProfile; cScore: number; pScore: number }> = [];

  for (const profile of db.profiles.list()) {
    if (profile.status !== 'ACTIVE') continue;
    if (!customerScopeMatches(profile, customer)) continue;
    if (!productScopeMatches(profile, product)) continue;
    matched.push({ profile, cScore: customerScore(profile), pScore: productScore(profile) });
  }

  matched.sort((a, b) => {
    if (b.cScore !== a.cScore) return b.cScore - a.cScore;
    if (b.pScore !== a.pScore) return b.pScore - a.pScore;
    const tA = Date.parse(a.profile.updatedAt);
    const tB = Date.parse(b.profile.updatedAt);
    if (tB !== tA) return tB - tA;
    return a.profile.id.localeCompare(b.profile.id);
  });

  const considered: ConsideredProfile[] = matched.map(({ profile, cScore, pScore }) => ({
    profileId: profile.id,
    profileName: profile.name,
    customerScore: cScore,
    productScore: pScore,
    matched: true,
  }));

  if (matched.length === 0) {
    return {
      customerId,
      productId,
      basePrice: round2(product.basePrice),
      finalPrice: round2(product.basePrice),
      source: { kind: 'BASE_PRICE' },
      explanation: 'No matching pricing profile; base price returned.',
      consideredProfiles: considered,
    };
  }

  const winner = matched[0]!.profile;
  const { price, clamped, detail } = applyOverride(product.basePrice, winner.priceOverride);

  const scopeText = describeScope(winner);
  const clampNote = clamped ? ' (clamped to zero)' : '';
  const explanation =
    `Profile '${winner.name}' applied (${scopeText}). ${detail}${clampNote}`.trim();

  return {
    customerId,
    productId,
    basePrice: round2(product.basePrice),
    finalPrice: price,
    source: { kind: 'PROFILE', profileId: winner.id, profileName: winner.name },
    explanation,
    consideredProfiles: considered,
  };
}
