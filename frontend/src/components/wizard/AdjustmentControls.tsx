import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setAdjustmentDirection,
  setAdjustmentMode,
  setAdjustmentValue,
} from '../../store/pricingWizardSlice';

export default function AdjustmentControls(): JSX.Element {
  const dispatch = useAppDispatch();
  const adj = useAppSelector((s) => s.pricingWizard.adjustment);

  const isDynamic = adj.mode === 'DYNAMIC';
  const isEmpty = !Number.isFinite(adj.value);
  const isOutOfRange =
    !isEmpty && (adj.value < 0 || (isDynamic && adj.value > 100));
  const isInvalid = isEmpty || isOutOfRange;

  const errorMsg = !isInvalid
    ? ''
    : isEmpty
      ? 'Enter a value.'
      : isDynamic
        ? 'Dynamic value must be between 0 and 100.'
        : 'Fixed value must be 0 or greater.';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">Based on</span>
        <select
          disabled
          className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"
          aria-label="Based on price book"
        >
          <option>Global Wholesale Price</option>
          <option disabled>Customer Group Price (coming soon)</option>
          <option disabled>Contract Price (coming soon)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">Adjustment type</span>
        <div className="inline-flex rounded-md border border-slate-300 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => dispatch(setAdjustmentMode('FIXED'))}
            className={`flex-1 px-3 py-2 font-medium transition ${
              adj.mode === 'FIXED'
                ? 'bg-foboh-700 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            aria-pressed={adj.mode === 'FIXED'}
          >
            Fixed ($)
          </button>
          <button
            type="button"
            onClick={() => dispatch(setAdjustmentMode('DYNAMIC'))}
            className={`flex-1 px-3 py-2 font-medium transition border-l border-slate-300 ${
              adj.mode === 'DYNAMIC'
                ? 'bg-foboh-700 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            aria-pressed={adj.mode === 'DYNAMIC'}
          >
            Dynamic (%)
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">Direction</span>
        <div className="inline-flex rounded-md border border-slate-300 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => dispatch(setAdjustmentDirection('INCREASE'))}
            className={`flex-1 px-3 py-2 font-medium transition ${
              adj.direction === 'INCREASE'
                ? 'bg-foboh-700 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            aria-pressed={adj.direction === 'INCREASE'}
          >
            Increase (+)
          </button>
          <button
            type="button"
            onClick={() => dispatch(setAdjustmentDirection('DECREASE'))}
            className={`flex-1 px-3 py-2 font-medium transition border-l border-slate-300 ${
              adj.direction === 'DECREASE'
                ? 'bg-foboh-700 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            aria-pressed={adj.direction === 'DECREASE'}
          >
            Decrease (−)
          </button>
        </div>
      </div>

      <div className="md:col-span-3 flex flex-col gap-1.5 max-w-xs">
        <label className="text-sm font-medium text-slate-700" htmlFor="adj-value">
          Value {isDynamic ? '(%)' : '($)'}
        </label>
        <input
          id="adj-value"
          type="number"
          inputMode="decimal"
          min={0}
          max={isDynamic ? 100 : undefined}
          step={isDynamic ? 0.1 : 0.01}
          value={Number.isFinite(adj.value) ? adj.value : ''}
          onChange={(e) =>
            dispatch(
              setAdjustmentValue(
                e.target.value === '' ? Number.NaN : Number(e.target.value),
              ),
            )
          }
          aria-invalid={isInvalid}
          className={`rounded-md border px-3 py-2 text-sm focus:ring-1 outline-none ${
            isInvalid
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-300 focus:border-foboh-700 focus:ring-foboh-700'
          }`}
        />
        {errorMsg ? <span className="text-xs text-red-600">{errorMsg}</span> : null}
      </div>
    </div>
  );
}
