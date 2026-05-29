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
  | { kind: 'PROFILE'; profileId: string; profileName: string };

export type ResolveResult = {
  customerId: string;
  productId: string;
  basePrice: number;
  finalPrice: number;
  source: ResolveSource;
  explanation: string;
  consideredProfiles: Array<{
    profileId: string;
    profileName: string;
    customerScore: number;
    productScore: number;
    matched: true;
  }>;
};

export type PreviewLine = {
  productId: string;
  basePrice: number;
  newPrice: number;
  clamped: boolean;
};

export type Listed<T> = { items: T[] };
