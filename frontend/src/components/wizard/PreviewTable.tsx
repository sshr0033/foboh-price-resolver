import { useMemo } from 'react';
import { usePreviewPricesQuery } from '../../store/api';
import { useAppSelector } from '../../store/hooks';
import { buildPriceOverride } from '../../store/pricingWizardSlice';
import { useDebounced, formatAUD } from '../../utils/debounce';
import type { Product } from '../../types';

type Props = { products: Product[] };

export default function PreviewTable({ products }: Props): JSX.Element | null {
  const wizard = useAppSelector((s) => s.pricingWizard);
  const selectedIds = wizard.selectedProductIds;
  const override = buildPriceOverride(wizard);

  // Debounce both the selection list and the override so we don't hammer the API.
  const debouncedIds = useDebounced(selectedIds, 300);
  const debouncedOverride = useDebounced(override, 300);

  const skip = debouncedIds.length === 0;
  const { data, isFetching, error } = usePreviewPricesQuery(
    { productIds: debouncedIds, priceOverride: debouncedOverride },
    { skip },
  );

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  if (selectedIds.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
        Select at least one product to preview the adjusted prices.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Preview failed. The override may be invalid.
      </div>
    );
  }

  const items = data?.items ?? [];
  const adj = wizard.adjustment;
  const adjLabel = adj.useCustomPrice
    ? `Custom ${formatAUD(adj.customPrice)}`
    : `${adj.mode === 'FIXED' ? 'Fixed $' : 'Dynamic '}${adj.value}${
        adj.mode === 'FIXED' ? '' : '%'
      } ${adj.direction === 'INCREASE' ? 'increase' : 'decrease'}`;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-medium text-slate-600">
          Preview · {items.length} product{items.length === 1 ? '' : 's'}
        </span>
        {isFetching ? (
          <span className="text-xs text-slate-500">Calculating…</span>
        ) : (
          <span className="text-xs text-slate-500">{adjLabel}</span>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-white sticky top-0 border-b border-slate-200">
            <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Sub-category</th>
              <th className="px-4 py-2 text-right">Base Price</th>
              <th className="px-4 py-2 text-right">Adjustment</th>
              <th className="px-4 py-2 text-right">New Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((line) => {
              const product = productById.get(line.productId);
              if (!product) return null;
              const delta = line.newPrice - line.basePrice;
              const deltaLabel =
                delta >= 0
                  ? `+${formatAUD(delta)}`
                  : `−${formatAUD(Math.abs(delta))}`;
              return (
                <tr key={line.productId} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{product.title}</td>
                  <td className="px-4 py-2 text-slate-600">{product.sku}</td>
                  <td className="px-4 py-2 text-slate-600">{product.subCategory}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-700">
                    {formatAUD(line.basePrice)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                    {deltaLabel}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    <span className="font-semibold text-slate-900">
                      {formatAUD(line.newPrice)}
                    </span>
                    {line.clamped ? (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 uppercase">
                        clamped
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
