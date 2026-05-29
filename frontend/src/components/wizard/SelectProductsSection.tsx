import { useListProductsQuery } from '../../store/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setScopeChoice, type ScopeChoice } from '../../store/pricingWizardSlice';
import { useDebounced } from '../../utils/debounce';
import AdjustmentControls from './AdjustmentControls';
import FilterBar from './FilterBar';
import PreviewTable from './PreviewTable';
import ProductList from './ProductList';

const SCOPES: { value: ScopeChoice; label: string; hint: string }[] = [
  { value: 'ONE', label: 'One Product', hint: 'Pick a single SKU' },
  { value: 'MULTIPLE', label: 'Multiple Products', hint: 'Filter and select several' },
  { value: 'ALL', label: 'All Products', hint: 'Snapshot of every product' },
];

export default function SelectProductsSection(): JSX.Element {
  const dispatch = useAppDispatch();
  const scopeChoice = useAppSelector((s) => s.pricingWizard.scopeChoice);
  const filters = useAppSelector((s) => s.pricingWizard.filters);
  const debouncedQ = useDebounced(filters.q, 250);

  const queryArgs = {
    q: debouncedQ || undefined,
    subCategory: filters.subCategory || undefined,
    segment: filters.segment || undefined,
    brand: filters.brand || undefined,
  };

  const { data, isLoading, isError } = useListProductsQuery(queryArgs);
  const products = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-slate-700 mb-1">Scope</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SCOPES.map((s) => {
            const active = scopeChoice === s.value;
            return (
              <label
                key={s.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  active
                    ? 'border-foboh-700 bg-foboh-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  value={s.value}
                  checked={active}
                  onChange={() => dispatch(setScopeChoice(s.value))}
                  className="mt-0.5 h-4 w-4 text-foboh-700 focus:ring-foboh-700"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{s.label}</span>
                  <span className="block text-xs text-slate-500">{s.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-800">Find products</h3>
        <FilterBar products={products} />
        <ProductList products={products} loading={isLoading} error={isError} />
      </div>

      <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">Set the price adjustment</h3>
        <AdjustmentControls />
      </div>

      <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">Preview new prices</h3>
        <PreviewTable products={products} />
      </div>
    </div>
  );
}
