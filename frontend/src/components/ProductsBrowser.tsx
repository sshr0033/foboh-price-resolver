import { useMemo, useState } from 'react';
import { useListProductsQuery } from '../store/api';
import { formatAUD, useDebounced } from '../utils/debounce';

export default function ProductsBrowser(): JSX.Element {
  const [q, setQ] = useState('');
  const [segment, setSegment] = useState('');
  const debouncedQ = useDebounced(q, 250);

  // Source-of-truth query for the table (server-filtered).
  const filtered = useListProductsQuery({
    q: debouncedQ || undefined,
    segment: segment || undefined,
  });

  // Separate unfiltered query used only to populate the segment dropdown.
  const allForFacets = useListProductsQuery({});

  const segments = useMemo(() => {
    const set = new Set<string>();
    for (const p of allForFacets.data?.items ?? []) set.add(p.segment);
    return Array.from(set).sort();
  }, [allForFacets.data]);

  const items = filtered.data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title or SKU"
          aria-label="Search products"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
        />
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          aria-label="Filter by segment"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
        >
          <option value="">All segments</option>
          {segments.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
          {filtered.isFetching
            ? 'Loading…'
            : `${items.length} product${items.length === 1 ? '' : 's'}`}
        </div>
        {filtered.isError ? (
          <div className="px-4 py-10 text-center text-sm text-red-600">
            Could not load products. Check the backend is running on :4000.
          </div>
        ) : items.length === 0 && !filtered.isFetching ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            No products match those filters.
          </div>
        ) : (
          <div className="max-h-[55vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-white sticky top-0 border-b border-slate-200">
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">SKU</th>
                  <th className="px-4 py-2">Brand</th>
                  <th className="px-4 py-2">Sub-category</th>
                  <th className="px-4 py-2">Segment</th>
                  <th className="px-4 py-2 text-right">Base Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-900">{p.title}</td>
                    <td className="px-4 py-2 text-slate-600 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-2 text-slate-600">{p.brand}</td>
                    <td className="px-4 py-2 text-slate-600">{p.subCategory}</td>
                    <td className="px-4 py-2 text-slate-600">{p.segment}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-900 font-medium">
                      {formatAUD(p.basePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
