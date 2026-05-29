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

// ── Specificity hierarchy ──────────────────────────────────────────────────
//
// Customer-specificity dominates product-specificity (see README §5). Of the
// 9 combinations of (customerScope.type, productScope.type), 5 align with the
// canonical commercial "levels" we expose; the other 4 fit naturally between
// or after them based on the same customer-first ordering.

const SPECIFICITY_MAP: Record<string, { level: number; label: string }> = {
  'CUSTOMER:PRODUCT_LIST': { level: 1, label: 'Exact Customer + Exact Product' },
  'CUSTOMER:RULE':         { level: 2, label: 'Exact Customer + Product Group' },
  'CUSTOMER:ALL':          { level: 3, label: 'Exact Customer + All Products' },
  'GROUP:PRODUCT_LIST':    { level: 4, label: 'Customer Group + Exact Product' },
  'GROUP:RULE':            { level: 5, label: 'Customer Group + Product Group' },
  'GROUP:ALL':             { level: 6, label: 'Customer Group + All Products' },
  'ALL:PRODUCT_LIST':      { level: 7, label: 'All Customers + Exact Product' },
  'ALL:RULE':              { level: 8, label: 'Global Product Rule' },
  'ALL:ALL':               { level: 9, label: 'Universal (All Customers + All Products)' },
};

function specificityFor(profile: PricingProfile): { level: number; label: string } {
  const key = `${profile.customerScope.type}:${profile.productScope.type}`;
  return (
    SPECIFICITY_MAP[key] ?? {
      level: 99,
      label: `${profile.customerScope.type} + ${profile.productScope.type}`,
    }
  );
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

// ── Match checks (return human-readable reason on failure) ─────────────────

type MatchCheck = { matched: true } | { matched: false; reason: string };

function checkCustomerScope(profile: PricingProfile, customer: Customer): MatchCheck {
  const cs = profile.customerScope;
  if (cs.type === 'ALL') return { matched: true };
  if (cs.type === 'CUSTOMER') {
    if (cs.customerId === customer.id) return { matched: true };
    const target = db.customers.get(cs.customerId);
    const targetName = target?.name ?? cs.customerId;
    return {
      matched: false,
      reason: `Customer scope mismatch — profile targets '${targetName}', not '${customer.name}'.`,
    };
  }
  // GROUP
  if (customer.groupIds.includes(cs.groupId)) return { matched: true };
  const group = db.groups.get(cs.groupId);
  const groupName = group?.name ?? cs.groupId;
  return {
    matched: false,
    reason: `Customer scope mismatch — '${customer.name}' is not in the '${groupName}' group.`,
  };
}

function checkProductScope(profile: PricingProfile, product: Product): MatchCheck {
  const ps = profile.productScope;
  if (ps.type === 'ALL') return { matched: true };
  if (ps.type === 'PRODUCT_LIST') {
    if (ps.productIds.includes(product.id)) return { matched: true };
    return {
      matched: false,
      reason: `Product scope mismatch — '${product.title}' is not in this profile's product list.`,
    };
  }
  // RULE — surface the first failing filter for a precise reason
  const f = ps.filters;
  if (f.segment && f.segment !== product.segment) {
    return {
      matched: false,
      reason: `Product scope mismatch — segment '${product.segment}' doesn't match rule filter '${f.segment}'.`,
    };
  }
  if (f.brand && f.brand !== product.brand) {
    return {
      matched: false,
      reason: `Product scope mismatch — brand '${product.brand}' doesn't match rule filter '${f.brand}'.`,
    };
  }
  if (f.subCategory && f.subCategory !== product.subCategory) {
    return {
      matched: false,
      reason: `Product scope mismatch — sub-category '${product.subCategory}' doesn't match rule filter '${f.subCategory}'.`,
    };
  }
  return { matched: true };
}

// ── Price math ─────────────────────────────────────────────────────────────

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

// ── Main resolver ──────────────────────────────────────────────────────────

type MatchedRecord = {
  profile: PricingProfile;
  cScore: number;
  pScore: number;
  level: number;
  label: string;
};

type RejectedRecord = {
  profile: PricingProfile;
  reason: string;
};

export function resolvePrice(customerId: string, productId: string): ResolveResult {
  const customer = getCustomer(customerId);
  const product = db.products.get(productId);
  if (!product) throw new HttpError(404, 'Product not found');
  if (product.isDeleted) throw new HttpError(410, 'Product has been deleted');

  const matched: MatchedRecord[] = [];
  const rejected: RejectedRecord[] = [];

  for (const profile of db.profiles.list()) {
    if (profile.status !== 'ACTIVE') {
      rejected.push({
        profile,
        reason: `Profile status is ${profile.status} — only ACTIVE profiles are considered.`,
      });
      continue;
    }
    const cMatch = checkCustomerScope(profile, customer);
    if (!cMatch.matched) {
      rejected.push({ profile, reason: cMatch.reason });
      continue;
    }
    const pMatch = checkProductScope(profile, product);
    if (!pMatch.matched) {
      rejected.push({ profile, reason: pMatch.reason });
      continue;
    }
    const { level, label } = specificityFor(profile);
    matched.push({
      profile,
      cScore: customerScore(profile),
      pScore: productScore(profile),
      level,
      label,
    });
  }

  // Customer-first sort; ties broken by updatedAt DESC, then id ASC.
  matched.sort((a, b) => {
    if (b.cScore !== a.cScore) return b.cScore - a.cScore;
    if (b.pScore !== a.pScore) return b.pScore - a.pScore;
    const tA = Date.parse(a.profile.updatedAt);
    const tB = Date.parse(b.profile.updatedAt);
    if (tB !== tA) return tB - tA;
    return a.profile.id.localeCompare(b.profile.id);
  });

  const winner = matched[0];

  // Sort rejected by name for stable, scannable output in the breakdown UI.
  rejected.sort((a, b) => a.profile.name.localeCompare(b.profile.name));

  const considered: ConsideredProfile[] = [
    ...matched.map((m) => ({
      profileId: m.profile.id,
      profileName: m.profile.name,
      matched: true as const,
      customerScore: m.cScore,
      productScore: m.pScore,
      level: m.level,
      label: m.label,
      isWinner: winner !== undefined && m.profile.id === winner.profile.id,
    })),
    ...rejected.map((r) => ({
      profileId: r.profile.id,
      profileName: r.profile.name,
      matched: false as const,
      reason: r.reason,
    })),
  ];

  if (!winner) {
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

  const { price, clamped, detail } = applyOverride(product.basePrice, winner.profile.priceOverride);
  const clampNote = clamped ? ' (clamped to zero)' : '';
  const explanation =
    `Profile '${winner.profile.name}' selected at Level ${winner.level} — ${winner.label}. ${detail}${clampNote}`.trim();

  return {
    customerId,
    productId,
    basePrice: round2(product.basePrice),
    finalPrice: price,
    source: {
      kind: 'PROFILE',
      profileId: winner.profile.id,
      profileName: winner.profile.name,
      level: winner.level,
      label: winner.label,
    },
    explanation,
    consideredProfiles: considered,
  };
}
