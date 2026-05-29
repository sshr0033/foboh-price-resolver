import { useState } from 'react';
import {
  useLazyResolvePriceQuery,
  useListCustomersQuery,
  useListProductsQuery,
} from '../../store/api';
import { formatAUD } from '../../utils/debounce';

type Props = {
  /** When true, suppresses the outer card chrome and the redundant heading.
   * Use this when rendering the panel inside a host that already provides them
   * (e.g. inside a Modal whose own header already describes the action). */
  embedded?: boolean;
};

export default function ResolverPanel({ embedded = false }: Props): JSX.Element {
  const customers = useListCustomersQuery();
  const products = useListProductsQuery({});
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [trigger, result] = useLazyResolvePriceQuery();

  const canResolve = customerId && productId;

  const onResolve = (): void => {
    if (!canResolve) return;
    void trigger({ customerId, productId });
  };

  const wrapperClass = embedded
    ? 'flex flex-col gap-4'
    : 'bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4';

  return (
    <section className={wrapperClass}>
      {embedded ? null : (
        <div>
          <h2 className="font-semibold text-slate-900">Try the resolver</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Pick a customer and a product to see which pricing profile applies — and why.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-600">Customer</span>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
            disabled={customers.isLoading}
          >
            <option value="">Select customer…</option>
            {customers.data?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-600">Product</span>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
            disabled={products.isLoading}
          >
            <option value="">Select product…</option>
            {products.data?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onResolve}
          disabled={!canResolve || result.isFetching}
          className="rounded-md bg-foboh-700 text-white text-sm font-semibold px-4 py-2 hover:bg-foboh-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
        >
          {result.isFetching ? 'Resolving…' : 'Resolve price'}
        </button>
      </div>

      {result.error ? (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Could not resolve:{' '}
          {String(
            (result.error as { data?: { error?: string } }).data?.error ?? 'unknown error',
          )}
        </div>
      ) : null}

      {result.data ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex flex-col gap-2">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              Final price
            </span>
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatAUD(result.data.finalPrice)}
            </span>
            <span className="text-sm text-slate-500">
              Base: {formatAUD(result.data.basePrice)}
            </span>
          </div>
          <div className="text-sm text-slate-700">
            <span className="font-medium">Source:</span>{' '}
            {result.data.source.kind === 'BASE_PRICE' ? (
              <span className="text-slate-600">No profile matched — base price.</span>
            ) : (
              <span className="text-foboh-700 font-medium">{result.data.source.profileName}</span>
            )}
          </div>
          <div className="text-sm text-slate-700">
            <span className="font-medium">Explanation:</span> {result.data.explanation}
          </div>
          {result.data.consideredProfiles.length > 0 ? (
            <details className="text-xs text-slate-600 mt-1">
              <summary className="cursor-pointer font-medium text-slate-700">
                {result.data.consideredProfiles.length} profile
                {result.data.consideredProfiles.length === 1 ? '' : 's'} considered
              </summary>
              <ul className="mt-2 space-y-1">
                {result.data.consideredProfiles.map((c, i) => (
                  <li key={c.profileId}>
                    {i === 0 ? '★ ' : '· '}
                    <span className="font-medium">{c.profileName}</span> — specificity (
                    {c.customerScore},{c.productScore})
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
