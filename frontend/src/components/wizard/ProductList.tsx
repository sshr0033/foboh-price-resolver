import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deselectAll, selectAll, toggleProduct } from '../../store/pricingWizardSlice';
import { formatAUD } from '../../utils/debounce';
import type { Product } from '../../types';

type Props = { products: Product[]; loading: boolean; error: boolean };

export default function ProductList({ products, loading, error }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector((s) => s.pricingWizard.selectedProductIds);
  const selectedSet = new Set(selectedIds);
  const filteredIds = products.map((p) => p.id);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedSet.has(id));

  if (loading) {
    return <div className="py-8 text-center text-sm text-slate-500">Loading products…</div>;
  }
  if (error) {
    return (
      <div className="py-8 text-center text-sm text-red-600">
        Could not load products. Check the backend is running on :4000.
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        No products match the current filters.
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-medium text-slate-600">
          {products.length} product{products.length === 1 ? '' : 's'} · {selectedIds.length}{' '}
          selected
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => dispatch(selectAll(filteredIds))}
            disabled={allFilteredSelected}
            className="text-xs font-medium text-foboh-700 hover:underline disabled:text-slate-400 disabled:no-underline"
          >
            Select all
          </button>
          <span className="text-slate-300 text-xs">·</span>
          <button
            type="button"
            onClick={() => dispatch(deselectAll(filteredIds))}
            disabled={!filteredIds.some((id) => selectedSet.has(id))}
            className="text-xs font-medium text-slate-600 hover:underline disabled:text-slate-400 disabled:no-underline"
          >
            Deselect all
          </button>
        </div>
      </div>
      <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {products.map((p) => {
          const checked = selectedSet.has(p.id);
          return (
            <li key={p.id}>
              <label className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => dispatch(toggleProduct(p.id))}
                  className="h-4 w-4 rounded border-slate-300 text-foboh-700 focus:ring-foboh-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{p.title}</div>
                  <div className="text-xs text-slate-500">
                    {p.sku} · {p.brand} · {p.subCategory} · {p.segment}
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-700 tabular-nums">
                  {formatAUD(p.basePrice)}
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
