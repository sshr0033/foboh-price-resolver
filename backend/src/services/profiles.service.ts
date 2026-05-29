import { v4 as uuid } from 'uuid';
import { db } from '../store/index.js';
import { HttpError } from '../utils/errors.js';
import type { PricingProfile, ProfileStatus } from '../types.js';
import type { ProfileCreateInput, ProfilePatchInput } from '../schemas/profile.js';

function assertReferencesValid(input: ProfileCreateInput | ProfilePatchInput): void {
  if (input.customerScope) {
    const cs = input.customerScope;
    if (cs.type === 'CUSTOMER' && !db.customers.get(cs.customerId)) {
      throw new HttpError(400, `Customer not found: ${cs.customerId}`);
    }
    if (cs.type === 'GROUP' && !db.groups.get(cs.groupId)) {
      throw new HttpError(400, `Group not found: ${cs.groupId}`);
    }
  }
  if (input.productScope && input.productScope.type === 'PRODUCT_LIST') {
    for (const pid of input.productScope.productIds) {
      const p = db.products.get(pid);
      if (!p) throw new HttpError(400, `Product not found: ${pid}`);
      if (p.isDeleted) throw new HttpError(400, `Product is deleted: ${pid}`);
    }
  }
}

export function listProfiles(status?: ProfileStatus): PricingProfile[] {
  const all = db.profiles.list();
  return status ? all.filter((p) => p.status === status) : all;
}

export function getProfile(id: string): PricingProfile {
  const p = db.profiles.get(id);
  if (!p) throw new HttpError(404, 'Profile not found');
  return p;
}

export function createProfile(input: ProfileCreateInput): PricingProfile {
  assertReferencesValid(input);
  const now = new Date().toISOString();
  const profile: PricingProfile = {
    id: `pp_${uuid()}`,
    name: input.name,
    description: input.description,
    customerScope: input.customerScope,
    productScope: input.productScope,
    priceOverride: input.priceOverride,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };
  return db.profiles.create(profile);
}

export function updateProfile(id: string, input: ProfilePatchInput): PricingProfile {
  const existing = getProfile(id);
  assertReferencesValid(input);
  const updated: PricingProfile = {
    ...existing,
    ...input,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  return db.profiles.update(id, updated);
}

export function deleteProfile(id: string): void {
  if (!db.profiles.delete(id)) throw new HttpError(404, 'Profile not found');
}
