import { type FormEvent, useMemo, useState } from 'react';
import {
  useListCustomersQuery,
  useListGroupsQuery,
  useListProductsQuery,
  useUpdateProfileMutation,
} from '../store/api';
import { pushToast } from './Toast';
import { formatAUD } from '../utils/debounce';
import type {
  AdjustmentDirection,
  AdjustmentMode,
  CustomerScope,
  PriceOverride,
  PricingProfile,
  ProductScope,
  ProfileStatus,
} from '../types';

type Props = {
  profile: PricingProfile;
  onCancel: () => void;
  onSaved: () => void;
};

type CustomerScopeType = 'CUSTOMER' | 'GROUP' | 'ALL';
type ProductScopeType = 'PRODUCT_LIST' | 'RULE' | 'ALL';
type OverrideType = 'ADJUSTMENT' | 'CUSTOM_PRICE';

// Tiny segmented control used throughout the form. Generic on the value type
// so each instance stays strongly typed.
function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
}): JSX.Element {
  return (
    <div
      className="inline-flex rounded-md border border-slate-300 overflow-hidden text-sm bg-white w-fit"
      role="group"
      aria-label={label}
    >
      {options.map((opt, i) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`px-4 py-2 font-medium transition ${
              active ? 'bg-foboh-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
            } ${i > 0 ? 'border-l border-slate-300' : ''}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}): JSX.Element {
  return (
    <div className="pb-1">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {hint ? <p className="text-xs text-slate-500 mt-0.5">{hint}</p> : null}
    </div>
  );
}

export default function ProfileEditForm({ profile, onCancel, onSaved }: Props): JSX.Element {
  const [updateProfile, updateState] = useUpdateProfileMutation();
  const customers = useListCustomersQuery();
  const groups = useListGroupsQuery();
  const productsQuery = useListProductsQuery({});
  const allProducts = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data]);

  // Basic fields
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description ?? '');
  const [status, setStatus] = useState<ProfileStatus>(profile.status);

  // Customer scope
  const [csType, setCsType] = useState<CustomerScopeType>(profile.customerScope.type);
  const [customerId, setCustomerId] = useState(
    profile.customerScope.type === 'CUSTOMER' ? profile.customerScope.customerId : '',
  );
  const [groupId, setGroupId] = useState(
    profile.customerScope.type === 'GROUP' ? profile.customerScope.groupId : '',
  );

  // Product scope
  const [psType, setPsType] = useState<ProductScopeType>(profile.productScope.type);
  const [productIds, setProductIds] = useState<string[]>(
    profile.productScope.type === 'PRODUCT_LIST' ? profile.productScope.productIds : [],
  );
  const initialFilters = profile.productScope.type === 'RULE' ? profile.productScope.filters : {};
  const [ruleSegment, setRuleSegment] = useState(initialFilters.segment ?? '');
  const [ruleSubCategory, setRuleSubCategory] = useState(initialFilters.subCategory ?? '');
  const [ruleBrand, setRuleBrand] = useState(initialFilters.brand ?? '');
  const [productSearch, setProductSearch] = useState('');

  // Price override
  const [ovType, setOvType] = useState<OverrideType>(profile.priceOverride.type);
  const initialAdj =
    profile.priceOverride.type === 'ADJUSTMENT' ? profile.priceOverride.adjustment : null;
  const [adjMode, setAdjMode] = useState<AdjustmentMode>(initialAdj?.mode ?? 'DYNAMIC');
  const [adjDirection, setAdjDirection] = useState<AdjustmentDirection>(
    initialAdj?.direction ?? 'DECREASE',
  );
  const [adjValue, setAdjValue] = useState<number>(initialAdj?.value ?? 0);
  const [customPrice, setCustomPrice] = useState<number>(
    profile.priceOverride.type === 'CUSTOM_PRICE' ? profile.priceOverride.price : 0,
  );

  // Derived facets for the rule dropdowns
  const segments = useMemo(
    () => Array.from(new Set(allProducts.map((p) => p.segment))).sort(),
    [allProducts],
  );
  const subCategories = useMemo(
    () => Array.from(new Set(allProducts.map((p) => p.subCategory))).sort(),
    [allProducts],
  );
  const brands = useMemo(
    () => Array.from(new Set(allProducts.map((p) => p.brand))).sort(),
    [allProducts],
  );

  // Search filter for the product picker
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [allProducts, productSearch]);

  // Validation — collected so we can surface them in one place
  const errors = useMemo(() => {
    const out: string[] = [];
    if (!name.trim()) out.push('Profile name is required.');
    if (csType === 'CUSTOMER' && !customerId) out.push('Pick a customer.');
    if (csType === 'GROUP' && !groupId) out.push('Pick a customer group.');
    if (psType === 'PRODUCT_LIST' && productIds.length === 0)
      out.push('Pick at least one product.');
    if (psType === 'RULE' && !ruleSegment && !ruleSubCategory && !ruleBrand)
      out.push('Rule scope needs at least one filter.');
    if (ovType === 'ADJUSTMENT') {
      if (!Number.isFinite(adjValue)) out.push('Enter an adjustment value.');
      else if (adjValue < 0) out.push('Adjustment value must be 0 or greater.');
      else if (adjMode === 'DYNAMIC' && adjValue > 100)
        out.push('Dynamic adjustment must be between 0 and 100.');
    }
    if (ovType === 'CUSTOM_PRICE') {
      if (!Number.isFinite(customPrice)) out.push('Enter a custom price.');
      else if (customPrice < 0) out.push('Custom price must be 0 or greater.');
    }
    return out;
  }, [
    name,
    csType,
    customerId,
    groupId,
    psType,
    productIds.length,
    ruleSegment,
    ruleSubCategory,
    ruleBrand,
    ovType,
    adjMode,
    adjValue,
    customPrice,
  ]);

  const toggleProduct = (id: string): void => {
    setProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAllFiltered = (): void => {
    setProductIds((prev) => {
      const set = new Set(prev);
      for (const p of filteredProducts) set.add(p.id);
      return Array.from(set);
    });
  };

  const deselectAllFiltered = (): void => {
    const visible = new Set(filteredProducts.map((p) => p.id));
    setProductIds((prev) => prev.filter((id) => !visible.has(id)));
  };

  const buildCustomerScope = (): CustomerScope => {
    if (csType === 'CUSTOMER') return { type: 'CUSTOMER', customerId };
    if (csType === 'GROUP') return { type: 'GROUP', groupId };
    return { type: 'ALL' };
  };

  const buildProductScope = (): ProductScope => {
    if (psType === 'PRODUCT_LIST') return { type: 'PRODUCT_LIST', productIds };
    if (psType === 'RULE') {
      const filters: { segment?: string; subCategory?: string; brand?: string } = {};
      if (ruleSegment) filters.segment = ruleSegment;
      if (ruleSubCategory) filters.subCategory = ruleSubCategory;
      if (ruleBrand) filters.brand = ruleBrand;
      return { type: 'RULE', filters };
    }
    return { type: 'ALL' };
  };

  const buildPriceOverride = (): PriceOverride => {
    if (ovType === 'CUSTOM_PRICE') return { type: 'CUSTOM_PRICE', price: customPrice };
    return {
      type: 'ADJUSTMENT',
      adjustment: { mode: adjMode, direction: adjDirection, value: adjValue },
    };
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (errors.length > 0) {
      pushToast(errors[0] ?? 'Please fix the highlighted fields.', 'error');
      return;
    }
    try {
      await updateProfile({
        id: profile.id,
        patch: {
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          customerScope: buildCustomerScope(),
          productScope: buildProductScope(),
          priceOverride: buildPriceOverride(),
        },
      }).unwrap();
      pushToast('Profile updated.', 'success');
      onSaved();
    } catch (err) {
      const msg = (err as { data?: { error?: string } }).data?.error ?? 'Unknown error';
      pushToast(`Update failed: ${msg}`, 'error');
    }
  };

  const adjInvalid =
    ovType === 'ADJUSTMENT' &&
    (!Number.isFinite(adjValue) ||
      adjValue < 0 ||
      (adjMode === 'DYNAMIC' && adjValue > 100));
  const customPriceInvalid =
    ovType === 'CUSTOM_PRICE' && (!Number.isFinite(customPrice) || customPrice < 0);

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
      {/* Basic ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <SectionHeader title="Basics" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Profile name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
            />
          </label>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Status</span>
          <Segmented<ProfileStatus>
            value={status}
            onChange={setStatus}
            label="Profile status"
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'ACTIVE', label: 'Active' },
            ]}
          />
        </div>
      </div>

      {/* Customer scope ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
        <SectionHeader
          title="Customer groups / customers"
          hint="Choose who this profile applies to."
        />
        <Segmented<CustomerScopeType>
          value={csType}
          onChange={setCsType}
          label="Customer scope type"
          options={[
            { value: 'CUSTOMER', label: 'Specific customer' },
            { value: 'GROUP', label: 'Customer group' },
            { value: 'ALL', label: 'All customers' },
          ]}
        />
        {csType === 'CUSTOMER' ? (
          <label className="flex flex-col gap-1.5 max-w-md">
            <span className="text-xs font-medium text-slate-600">Customer</span>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={customers.isLoading}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
            >
              <option value="">Select customer…</option>
              {customers.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {csType === 'GROUP' ? (
          <label className="flex flex-col gap-1.5 max-w-md">
            <span className="text-xs font-medium text-slate-600">Customer group</span>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              disabled={groups.isLoading}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
            >
              <option value="">Select group…</option>
              {groups.data?.items.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {csType === 'ALL' ? (
          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
            This profile will be considered for every customer.
          </p>
        ) : null}
      </div>

      {/* Product scope ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
        <SectionHeader
          title="Target products / categories"
          hint="Choose which products the profile covers."
        />
        <Segmented<ProductScopeType>
          value={psType}
          onChange={setPsType}
          label="Product scope type"
          options={[
            { value: 'PRODUCT_LIST', label: 'Product list' },
            { value: 'RULE', label: 'Category rule' },
            { value: 'ALL', label: 'All products' },
          ]}
        />

        {psType === 'PRODUCT_LIST' ? (
          <div className="flex flex-col gap-2">
            <input
              type="search"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search title or SKU"
              aria-label="Search products"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {productIds.length} selected · {filteredProducts.length} visible
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-foboh-700 hover:underline font-medium"
                >
                  Select all
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={deselectAllFiltered}
                  className="text-slate-600 hover:underline font-medium"
                >
                  Deselect all
                </button>
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
              {productsQuery.isLoading ? (
                <div className="px-3 py-6 text-center text-sm text-slate-500">
                  Loading products…
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-500">
                  No matching products.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const checked = productIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProduct(p.id)}
                        className="h-4 w-4 rounded border-slate-300 text-foboh-700 focus:ring-foboh-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {p.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {p.sku} · {p.subCategory} · {p.segment}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        {formatAUD(p.basePrice)}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        {psType === 'RULE' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600">Segment</span>
              <select
                value={ruleSegment}
                onChange={(e) => setRuleSegment(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
              >
                <option value="">Any</option>
                {segments.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600">Sub-category</span>
              <select
                value={ruleSubCategory}
                onChange={(e) => setRuleSubCategory(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
              >
                <option value="">Any</option>
                {subCategories.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600">Brand</span>
              <select
                value={ruleBrand}
                onChange={(e) => setRuleBrand(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
              >
                <option value="">Any</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
            <p className="sm:col-span-3 text-xs text-slate-500">
              Set at least one filter. A product matches when <strong>every</strong> set filter
              matches its attribute.
            </p>
          </div>
        ) : null}

        {psType === 'ALL' ? (
          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
            Dynamic — resolves against the live product catalogue. New products are auto-covered.
          </p>
        ) : null}
      </div>

      {/* Price override ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
        <SectionHeader
          title="Price override"
          hint="How the resolver computes the final price for a matched product."
        />
        <Segmented<OverrideType>
          value={ovType}
          onChange={setOvType}
          label="Override type"
          options={[
            { value: 'ADJUSTMENT', label: 'Adjustment' },
            { value: 'CUSTOM_PRICE', label: 'Custom price' },
          ]}
        />

        {ovType === 'ADJUSTMENT' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600">Adjustment type</span>
              <Segmented<AdjustmentMode>
                value={adjMode}
                onChange={setAdjMode}
                label="Adjustment type"
                options={[
                  { value: 'FIXED', label: 'Fixed ($)' },
                  { value: 'DYNAMIC', label: 'Dynamic (%)' },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600">Direction</span>
              <Segmented<AdjustmentDirection>
                value={adjDirection}
                onChange={setAdjDirection}
                label="Adjustment direction"
                options={[
                  { value: 'INCREASE', label: 'Increase (+)' },
                  { value: 'DECREASE', label: 'Decrease (−)' },
                ]}
              />
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600">
                Value {adjMode === 'DYNAMIC' ? '(%)' : '($)'}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={adjMode === 'DYNAMIC' ? 100 : undefined}
                step={adjMode === 'DYNAMIC' ? 0.1 : 0.01}
                value={Number.isFinite(adjValue) ? adjValue : ''}
                onChange={(e) =>
                  setAdjValue(e.target.value === '' ? Number.NaN : Number(e.target.value))
                }
                aria-invalid={adjInvalid}
                className={`rounded-md border px-3 py-2 text-sm outline-none ${
                  adjInvalid
                    ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-slate-300 focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700'
                }`}
              />
            </label>
          </div>
        ) : null}

        {ovType === 'CUSTOM_PRICE' ? (
          <label className="flex flex-col gap-1.5 max-w-xs">
            <span className="text-xs font-medium text-slate-600">Flat final price ($)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={Number.isFinite(customPrice) ? customPrice : ''}
              onChange={(e) =>
                setCustomPrice(e.target.value === '' ? Number.NaN : Number(e.target.value))
              }
              aria-invalid={customPriceInvalid}
              className={`rounded-md border px-3 py-2 text-sm outline-none ${
                customPriceInvalid
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-300 focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700'
              }`}
            />
            <span className="text-xs text-slate-500">
              The customer pays exactly this regardless of base price.
            </span>
          </label>
        ) : null}
      </div>

      {/* Errors */}
      {errors.length > 0 ? (
        <ul className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-800 list-disc list-inside space-y-0.5">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      </div>

      {/* Footer — pinned outside the scroll area so it never covers content */}
      <div className="shrink-0 px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end gap-2 shadow-[0_-6px_12px_-6px_rgba(15,23,42,0.08)]">
        <button
          type="button"
          onClick={onCancel}
          disabled={updateState.isLoading}
          className="rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-semibold px-4 py-2 hover:bg-slate-50 disabled:opacity-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={updateState.isLoading || errors.length > 0}
          className="rounded-md bg-foboh-700 text-white text-sm font-semibold px-4 py-2 hover:bg-foboh-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
        >
          {updateState.isLoading ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
