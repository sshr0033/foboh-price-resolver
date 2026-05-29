import { useListProductsQuery } from '../../store/api';
import { useAppSelector } from '../../store/hooks';
import { useDebounced } from '../../utils/debounce';
import AdjustmentControls from './AdjustmentControls';
import FilterBar from './FilterBar';
import PreviewTable from './PreviewTable';
import ProductList from './ProductList';

export default function SelectProductsSection(): JSX.Element {
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
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Find products</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Search or filter, then tick the products this profile covers. Use{' '}
            <strong>Select all</strong> to grab every visible product at once.
          </p>
        </div>
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
