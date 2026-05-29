import { Link } from 'react-router-dom';
import { useListProfilesQuery } from '../store/api';
import ResolverPanel from '../components/resolver/ResolverPanel';
import ToastHost from '../components/Toast';
import { formatAUD } from '../utils/debounce';

function describeOverride(p: { priceOverride: { type: string } & Record<string, unknown> }): string {
  const o = p.priceOverride;
  if (o.type === 'CUSTOM_PRICE') {
    const price = typeof o.price === 'number' ? o.price : 0;
    return `Custom ${formatAUD(price)}`;
  }
  const a = o.adjustment as { mode: string; direction: string; value: number };
  const unit = a.mode === 'FIXED' ? `$${a.value}` : `${a.value}%`;
  const sign = a.direction === 'INCREASE' ? '+' : '−';
  return `${a.mode} ${sign}${unit}`;
}

function describeCustomerScope(s: { type: string } & Record<string, unknown>): string {
  if (s.type === 'CUSTOMER') return `Customer: ${String(s.customerId)}`;
  if (s.type === 'GROUP') return `Group: ${String(s.groupId)}`;
  return 'All customers';
}

function describeProductScope(s: { type: string } & Record<string, unknown>): string {
  if (s.type === 'PRODUCT_LIST') {
    const ids = s.productIds as string[];
    return `${ids.length} product${ids.length === 1 ? '' : 's'}`;
  }
  if (s.type === 'RULE') {
    const f = s.filters as Record<string, string | undefined>;
    return `Rule: ${Object.entries(f)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')}`;
  }
  return 'All products';
}

export default function PricingListPage(): JSX.Element {
  const { data, isLoading, isError } = useListProfilesQuery();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pricing Profiles</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bespoke prices for specific customers, groups, or product ranges.
          </p>
        </div>
        <Link
          to="/pricing/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-foboh-700 text-white text-sm font-semibold px-4 py-2 hover:bg-foboh-800 transition"
        >
          + New pricing profile
        </Link>
      </header>

      <ResolverPanel />

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Saved profiles</h2>
        </div>

        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">Loading profiles…</div>
        ) : isError ? (
          <div className="px-6 py-10 text-center text-sm text-red-600">
            Could not load profiles. Is the backend running on :4000?
          </div>
        ) : data && data.items.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                <th className="px-6 py-2.5">Name</th>
                <th className="px-6 py-2.5">Customer scope</th>
                <th className="px-6 py-2.5">Product scope</th>
                <th className="px-6 py-2.5">Override</th>
                <th className="px-6 py-2.5">Status</th>
                <th className="px-6 py-2.5">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-6 py-3 text-slate-600">{describeCustomerScope(p.customerScope)}</td>
                  <td className="px-6 py-3 text-slate-600">{describeProductScope(p.productScope)}</td>
                  <td className="px-6 py-3 text-slate-700 font-medium">{describeOverride(p)}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        p.status === 'ACTIVE'
                          ? 'bg-foboh-50 text-foboh-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500 text-xs">
                    {new Date(p.updatedAt).toLocaleDateString('en-AU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No profiles yet — create one to get started.
          </div>
        )}
      </section>

      <ToastHost />
    </div>
  );
}
