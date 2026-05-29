export type Product = {
  id: string;
  title: string;
  sku: string;
  brand: string;
  subCategory: string;
  segment: string;
  basePrice: number;
  uom: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerGroup = { id: string; name: string };

export type Customer = {
  id: string;
  name: string;
  groupIds: string[];
};

export type AdjustmentMode = 'FIXED' | 'DYNAMIC';
export type AdjustmentDirection = 'INCREASE' | 'DECREASE';

export type Adjustment = {
  mode: AdjustmentMode;
  direction: AdjustmentDirection;
  value: number;
};

export type CustomerScope =
  | { type: 'CUSTOMER'; customerId: string }
  | { type: 'GROUP'; groupId: string }
  | { type: 'ALL' };

export type ProductScope =
  | { type: 'PRODUCT_LIST'; productIds: string[] }
  | { type: 'RULE'; filters: { subCategory?: string; brand?: string; segment?: string } }
  | { type: 'ALL' };

export type PriceOverride =
  | { type: 'ADJUSTMENT'; adjustment: Adjustment }
  | { type: 'CUSTOM_PRICE'; price: number };

export type ProfileStatus = 'DRAFT' | 'ACTIVE';

export type PricingProfile = {
  id: string;
  name: string;
  description?: string;
  customerScope: CustomerScope;
  productScope: ProductScope;
  priceOverride: PriceOverride;
  status: ProfileStatus;
  createdAt: string;
  updatedAt: string;
};

export type ResolveSource =
  | { kind: 'BASE_PRICE' }
  | {
      kind: 'PROFILE';
      profileId: string;
      profileName: string;
      level: number;
      label: string;
    };

/**
 * A profile that was considered during resolution.
 *
 * The two variants are distinguished by `matched`:
 * - matched = true → carries scoring + level info, with `isWinner` flagging the chosen profile.
 * - matched = false → carries a human-readable rejection reason.
 */
export type ConsideredProfile =
  | {
      profileId: string;
      profileName: string;
      matched: true;
      customerScore: number;
      productScore: number;
      level: number;
      label: string;
      isWinner: boolean;
    }
  | {
      profileId: string;
      profileName: string;
      matched: false;
      reason: string;
    };

export type ResolveResult = {
  customerId: string;
  productId: string;
  basePrice: number;
  finalPrice: number;
  source: ResolveSource;
  explanation: string;
  consideredProfiles: ConsideredProfile[];
};

export type PreviewLine = {
  productId: string;
  basePrice: number;
  newPrice: number;
  clamped: boolean;
};
