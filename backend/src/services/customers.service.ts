import { db } from '../store/index.js';
import { HttpError } from '../utils/errors.js';
import type { Customer, CustomerGroup } from '../types.js';

export function listCustomers(): Customer[] {
  return db.customers.list();
}

export function getCustomer(id: string): Customer {
  const c = db.customers.get(id);
  if (!c) throw new HttpError(404, 'Customer not found');
  return c;
}

export function listGroups(): CustomerGroup[] {
  return db.groups.list();
}
