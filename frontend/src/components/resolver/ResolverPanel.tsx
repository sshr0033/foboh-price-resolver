import { useState } from 'react';
import {
  useLazyResolvePriceQuery,
  useListCustomersQuery,
  useListProductsQuery,
} from '../../store/api';
import { formatAUD } from '../../utils/debounce';
import type { ConsideredProfile } from '../../types';

type Props = {
  /** When true, suppresses the outer card chrome and the redundant heading.
   * Use this when rendering the panel inside a host that already provides them
   * (e.g. inside a Modal whose own header already describes the action). */
  embedded?: boolean;
};

type MatchedItem = Extract<ConsideredProfile, { matched: true }>;
type RejectedItem = Extract<ConsideredProfile, { matched: false }>;

function isMatched(c: ConsideredProfile): c is MatchedItem {
  return c.matched;
}
function isRejected(c: ConsideredProfile): c is RejectedItem {
  return !c.matched;
}

export default function ResolverPanel({ embedded = false }: Props): JSX.Element {
  const customers = useListCustomersQuery();
  const products = useListProductsQuery({});
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [trigger, result] = useLazyResolvePriceQuery();

  const canResolve = !!customerId && !!productId;

  const onResolve = (): void => {
    if (!canResolve) return;
    void trigger({ customerId, productId });
  };

  const wrapperClass = embedded
    ? 'flex flex-col gap-4'
    : 'bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4';

  const considered = result.data?.consideredProfiles ?? [];
  const matched = considered.filter(isMatched);
  const rejected = considered.filter(isRejected);

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
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3">
          {/* Final price headline */}
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

          {/* Source card */}
          {result.data.source.kind === 'PROFILE' ? (
            <div className="rounded-md bg-white border border-foboh-100 px-3 py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foboh-700">
                  {result.data.source.profileName}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-foboh-700 text-white uppercase tracking-wide">
                  Level {result.data.source.level}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-1">{result.data.source.label}</div>
            </div>
          ) : (
            <div className="rounded-md bg-white border border-slate-200 px-3 py-2.5">
              <span className="font-semibold text-slate-700">Base price</span>
              <div className="text-xs text-slate-500 mt-0.5">
                No matching pricing profile.
              </div>
            </div>
          )}

          {/* One-line explanation */}
          <div className="text-sm text-slate-700">
            <span className="font-medium">Why:</span> {result.data.explanation}
          </div>

          {/* Expandable breakdown */}
          {considered.length > 0 ? (
            <details className="rounded-md border border-slate-200 bg-white group">
              <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md flex items-center justify-between">
                <span>Show full breakdown</span>
                <span className="text-xs text-slate-500 font-normal">
                  {matched.length} matched · {rejected.length} rejected
                  <span className="ml-2 text-slate-400 group-open:hidden">▸</span>
                  <span className="ml-2 text-slate-400 hidden group-open:inline">▾</span>
                </span>
              </summary>
              <div className="px-3 pb-3 pt-2 border-t border-slate-100 flex flex-col gap-4">
                {matched.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Matched ({matched.length})
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {matched.map((c) => (
                        <li
                          key={c.profileId}
                          className={`rounded-md px-3 py-2 ${
                            c.isWinner
                              ? 'bg-foboh-50 border border-foboh-200'
                              : 'bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-900">
                              {c.isWinner ? '★ ' : ''}
                              {c.profileName}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                                c.isWinner
                                  ? 'bg-foboh-700 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              Level {c.level}
                            </span>
                            {c.isWinner ? (
                              <span className="text-[10px] font-bold text-foboh-700 uppercase tracking-wide">
                                Winner
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">{c.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            specificity ({c.customerScore},{c.productScore})
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {rejected.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Rejected ({rejected.length})
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {rejected.map((c) => (
                        <li
                          key={c.profileId}
                          className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2"
                        >
                          <div className="text-sm font-medium text-slate-700">
                            {c.profileName}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">{c.reason}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
