import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setFilter } from '../../store/pricingWizardSlice';
import type { Product } from '../../types';

type Props = { products: Product[] };

function unique(items: string[]): string[] {
  return Array.from(new Set(items)).sort();
}

export default function FilterBar({ products }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.pricingWizard.filters);

  const subCategories = unique(products.map((p) => p.subCategory));
  const segments = unique(products.map((p) => p.segment));
  const brands = unique(products.map((p) => p.brand));

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <input
        type="search"
        value={filters.q}
        onChange={(e) => dispatch(setFilter({ key: 'q', value: e.target.value }))}
        placeholder="Search title or SKU"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
        aria-label="Search products"
      />
      <select
        value={filters.subCategory}
        onChange={(e) => dispatch(setFilter({ key: 'subCategory', value: e.target.value }))}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
        aria-label="Sub-category"
      >
        <option value="">All sub-categories</option>
        {subCategories.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        value={filters.segment}
        onChange={(e) => dispatch(setFilter({ key: 'segment', value: e.target.value }))}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
        aria-label="Segment"
      >
        <option value="">All segments</option>
        {segments.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        value={filters.brand}
        onChange={(e) => dispatch(setFilter({ key: 'brand', value: e.target.value }))}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
        aria-label="Brand"
      >
        <option value="">All brands</option>
        {brands.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
