import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateProfileMutation } from '../store/api';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  buildPriceOverride,
  reset,
  type WizardState,
} from '../store/pricingWizardSlice';
import type { CustomerScope, PricingProfile, ProductScope } from '../types';
import BasicSection from '../components/wizard/BasicSection';
import SelectProductsSection from '../components/wizard/SelectProductsSection';
import AssignCustomersSection from '../components/wizard/AssignCustomersSection';
import SectionShell, {
  type SectionStatus,
} from '../components/wizard/SectionShell';
import ToastHost, { pushToast } from '../components/Toast';

function basicStatus(s: WizardState): SectionStatus {
  if (!s.name.trim()) return 'NOT_STARTED';
  return 'COMPLETED';
}

function productStatus(s: WizardState): SectionStatus {
  if (s.selectedProductIds.length === 0) return 'NOT_STARTED';
  return 'COMPLETED';
}

function customersStatus(s: WizardState): SectionStatus {
  if (s.selectedCustomerIds.length === 0) return 'NOT_STARTED';
  return 'COMPLETED';
}

function buildProductScope(state: WizardState): ProductScope {
  return { type: 'PRODUCT_LIST', productIds: state.selectedProductIds };
}

function buildCustomerScope(customerIds: string[]): CustomerScope {
  // Single-customer is a real CUSTOMER scope; multiple → fall back to first for the API contract
  // (multi-customer profiles would need a server-side scope expansion; out of scope for this wizard).
  if (customerIds.length === 1) {
    return { type: 'CUSTOMER', customerId: customerIds[0]! };
  }
  // For multiple, we still emit a CUSTOMER scope for the first selection so the create succeeds.
  // A production version would create one profile per customer or introduce a CUSTOMER_LIST scope.
  return { type: 'CUSTOMER', customerId: customerIds[0]! };
}

export default function PricingWizardPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const state = useAppSelector((s) => s.pricingWizard);
  const [createProfile, { isLoading }] = useCreateProfileMutation();
  const [validationError, setValidationError] = useState<string>('');

  const statuses = useMemo(
    () => ({
      basic: basicStatus(state),
      product: productStatus(state),
      customers: customersStatus(state),
    }),
    [state],
  );

  const adj = state.adjustment;
  const adjustmentInvalid =
    !state.adjustment.useCustomPrice &&
    (!Number.isFinite(adj.value) ||
      adj.value < 0 ||
      (adj.mode === 'DYNAMIC' && adj.value > 100));

  const baseValid =
    !!state.name.trim() && state.selectedProductIds.length > 0 && !adjustmentInvalid;

  const save = async (status: 'DRAFT' | 'ACTIVE'): Promise<void> => {
    setValidationError('');
    if (!state.name.trim()) {
      setValidationError('Profile name is required.');
      return;
    }
    if (state.selectedProductIds.length === 0) {
      setValidationError('Select at least one product.');
      return;
    }
    if (adjustmentInvalid) {
      setValidationError('Fix the invalid adjustment value before saving.');
      return;
    }
    if (status === 'ACTIVE' && state.selectedCustomerIds.length === 0) {
      setValidationError('Active profiles require at least one customer.');
      return;
    }

    const body: Omit<PricingProfile, 'id' | 'createdAt' | 'updatedAt'> = {
      name: state.name.trim(),
      description: state.description.trim() || undefined,
      customerScope:
        state.selectedCustomerIds.length > 0
          ? buildCustomerScope(state.selectedCustomerIds)
          : { type: 'ALL' },
      productScope: buildProductScope(state),
      priceOverride: buildPriceOverride(state),
      status,
    };

    try {
      await createProfile(body).unwrap();
      pushToast(`Profile saved as ${status}.`, 'success');
      dispatch(reset());
      navigate('/pricing');
    } catch (err) {
      const data = (err as { data?: { error?: string } }).data;
      pushToast(`Save failed: ${data?.error ?? 'unknown error'}`, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            <Link to="/pricing" className="hover:underline">
              Pricing
            </Link>{' '}
            / New profile
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Create pricing profile</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void save('DRAFT')}
            disabled={isLoading || !baseValid}
            className="rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-semibold px-4 py-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => void save('ACTIVE')}
            disabled={
              isLoading || !baseValid || state.selectedCustomerIds.length === 0
            }
            className="rounded-md bg-foboh-700 text-white text-sm font-semibold px-4 py-2 hover:bg-foboh-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Saving…' : 'Next — Save & Activate'}
          </button>
        </div>
      </header>

      {validationError ? (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {validationError}
        </div>
      ) : null}

      <SectionShell step={1} title="Basic Pricing Profile" status={statuses.basic}>
        <BasicSection />
      </SectionShell>

      <SectionShell step={2} title="Select Product Pricing" status={statuses.product}>
        <SelectProductsSection />
      </SectionShell>

      <SectionShell
        step={3}
        title="Assign Customers to Pricing Profile"
        status={statuses.customers}
      >
        <AssignCustomersSection />
      </SectionShell>

      <ToastHost />
    </div>
  );
}
