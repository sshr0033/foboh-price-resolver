import type { Product, Customer, CustomerGroup, PricingProfile } from '../types.js';

const NOW = new Date('2026-01-01T00:00:00.000Z').toISOString();

export const seedGroups: CustomerGroup[] = [
  { id: 'grp_independent', name: 'Independent Retailers' },
  { id: 'grp_vip', name: 'VIP' },
  { id: 'grp_onpremise', name: 'On-Premise' },
];

export const seedCustomers: Customer[] = [
  { id: 'cus_bondi', name: 'Bondi Cellars', groupIds: ['grp_independent', 'grp_vip'] },
  { id: 'cus_paddo', name: 'Paddington Wine Co', groupIds: ['grp_independent'] },
  { id: 'cus_aria', name: 'ARIA Restaurant Group', groupIds: ['grp_vip', 'grp_onpremise'] },
  { id: 'cus_corner', name: 'Corner Bottle Shop', groupIds: ['grp_independent'] },
  { id: 'cus_mercato', name: 'Mercato Cellars', groupIds: [] },
];

export const seedProducts: Product[] = [
  { id: 'prd_hgvpin21', title: 'High Garden Pinot Noir 2021', sku: 'HGVPIN216', brand: 'High Garden', subCategory: 'Red', segment: 'Wine', basePrice: 279.06, uom: '12 x 750ML Bottle Case', isDeleted: false, createdAt: NOW, updatedAt: NOW },
  { id: 'prd_koybrunv', title: 'Koyama Methode Brut Nature NV', sku: 'KOYBRUNV6', brand: 'Koyama Wines', subCategory: 'Sparkling', segment: 'Wine', basePrice: 120.00, uom: '6 x 750ML Bottle Case', isDeleted: false, createdAt: NOW, updatedAt: NOW },
  { id: 'prd_koynr18', title: 'Koyama Riesling 2018', sku: 'KOYNR1837', brand: 'Koyama Wines', subCategory: 'Port/Dessert', segment: 'Wine', basePrice: 215.04, uom: '12 x 750ML Bottle Case', isDeleted: false, createdAt: NOW, updatedAt: NOW },
  { id: 'prd_koyrie19', title: 'Koyama Tussock Riesling 2019', sku: 'KOYRIE19', brand: 'Koyama Wines', subCategory: 'White', segment: 'Wine', basePrice: 215.04, uom: '12 x 750ML Bottle Case', isDeleted: false, createdAt: NOW, updatedAt: NOW },
  { id: 'prd_lacbnat', title: 'Lacourte-Godbillon Brut Cru NV', sku: 'LACBNATNV6', brand: 'Lacourte-Godbillon', subCategory: 'Sparkling', segment: 'Wine', basePrice: 409.32, uom: '6 x 750ML Bottle Case', isDeleted: false, createdAt: NOW, updatedAt: NOW },
  { id: 'prd_hnhdh', title: 'HN Half Day Hazy', sku: 'HNHDH001', brand: 'Hawkers Beer', subCategory: 'Hazy IPA', segment: 'Beer', basePrice: 72.00, uom: '24 x 375ML Can Case', isDeleted: false, createdAt: NOW, updatedAt: NOW },
  { id: 'prd_crumbl', title: 'Crumbl Cookies Pale Ale', sku: 'CRUMBPAL01', brand: 'Crumbl Brewing', subCategory: 'Pale Ale', segment: 'Beer', basePrice: 68.00, uom: '24 x 375ML Can Case', isDeleted: false, createdAt: NOW, updatedAt: NOW },
  { id: 'prd_necsr', title: 'Necessaire Vermouth', sku: 'NECSV0001', brand: 'Necessaire', subCategory: 'Vermouth', segment: 'Spirits', basePrice: 58.00, uom: '6 x 750ML Bottle Case', isDeleted: false, createdAt: NOW, updatedAt: NOW },
  { id: 'prd_hgchard', title: 'High Garden Chardonnay 2022', sku: 'HGCHARD22', brand: 'High Garden', subCategory: 'White', segment: 'Wine', basePrice: 245.00, uom: '12 x 750ML Bottle Case', isDeleted: false, createdAt: NOW, updatedAt: NOW },
  { id: 'prd_legacy', title: 'Legacy Shiraz 2019 (Discontinued)', sku: 'LEGSHZ19', brand: 'High Garden', subCategory: 'Red', segment: 'Wine', basePrice: 180.00, uom: '12 x 750ML Bottle Case', isDeleted: true, createdAt: NOW, updatedAt: NOW },
];

export const seedProfiles: PricingProfile[] = [
  {
    id: 'pp_a_wine10off',
    name: 'Independent Retailers — 10% off Wine',
    description: 'Standing trade discount for independent retailers across the wine range.',
    customerScope: { type: 'GROUP', groupId: 'grp_independent' },
    productScope: { type: 'RULE', filters: { segment: 'Wine' } },
    priceOverride: { type: 'ADJUSTMENT', adjustment: { mode: 'DYNAMIC', direction: 'DECREASE', value: 10 } },
    status: 'ACTIVE',
    createdAt: NOW,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pp_b_sparkling15off',
    name: 'VIP — $15 off Sparkling Wine',
    description: 'VIP loyalty discount on all sparkling.',
    customerScope: { type: 'GROUP', groupId: 'grp_vip' },
    productScope: { type: 'RULE', filters: { segment: 'Wine', subCategory: 'Sparkling' } },
    priceOverride: { type: 'ADJUSTMENT', adjustment: { mode: 'FIXED', direction: 'DECREASE', value: 15 } },
    status: 'ACTIVE',
    createdAt: NOW,
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'pp_c_bondi_koyama95',
    name: 'Bondi Cellars — Koyama Brut bespoke',
    description: 'Hand-negotiated custom price for Bondi Cellars on Koyama Methode Brut.',
    customerScope: { type: 'CUSTOMER', customerId: 'cus_bondi' },
    productScope: { type: 'PRODUCT_LIST', productIds: ['prd_koybrunv'] },
    priceOverride: { type: 'CUSTOM_PRICE', price: 95.00 },
    status: 'ACTIVE',
    createdAt: NOW,
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
];
