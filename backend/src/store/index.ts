import type { Product, Customer, CustomerGroup, PricingProfile } from '../types.js';
import { seedCustomers, seedGroups, seedProducts, seedProfiles } from '../data/seed.js';

type Store = {
  products: Map<string, Product>;
  customers: Map<string, Customer>;
  groups: Map<string, CustomerGroup>;
  profiles: Map<string, PricingProfile>;
};

const store: Store = {
  products: new Map(seedProducts.map((p) => [p.id, { ...p }])),
  customers: new Map(seedCustomers.map((c) => [c.id, { ...c, groupIds: [...c.groupIds] }])),
  groups: new Map(seedGroups.map((g) => [g.id, { ...g }])),
  profiles: new Map(seedProfiles.map((p) => [p.id, structuredClone(p)])),
};

export const db = {
  products: {
    list(): Product[] {
      return Array.from(store.products.values());
    },
    get(id: string): Product | undefined {
      return store.products.get(id);
    },
  },
  customers: {
    list(): Customer[] {
      return Array.from(store.customers.values());
    },
    get(id: string): Customer | undefined {
      return store.customers.get(id);
    },
  },
  groups: {
    list(): CustomerGroup[] {
      return Array.from(store.groups.values());
    },
    get(id: string): CustomerGroup | undefined {
      return store.groups.get(id);
    },
  },
  profiles: {
    list(): PricingProfile[] {
      return Array.from(store.profiles.values());
    },
    get(id: string): PricingProfile | undefined {
      return store.profiles.get(id);
    },
    create(p: PricingProfile): PricingProfile {
      store.profiles.set(p.id, structuredClone(p));
      return structuredClone(p);
    },
    update(id: string, p: PricingProfile): PricingProfile {
      store.profiles.set(id, structuredClone(p));
      return structuredClone(p);
    },
    delete(id: string): boolean {
      return store.profiles.delete(id);
    },
  },
};
