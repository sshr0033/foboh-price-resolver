import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setDescription, setName } from '../../store/pricingWizardSlice';

export default function BasicSection(): JSX.Element {
  const dispatch = useAppDispatch();
  const { name, description } = useAppSelector((s) => s.pricingWizard);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">
          Pricing profile name <span className="text-red-500">*</span>
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => dispatch(setName(e.target.value))}
          placeholder="e.g. Bondi Cellars — Q1 contract"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">Description</span>
        <input
          type="text"
          value={description}
          onChange={(e) => dispatch(setDescription(e.target.value))}
          placeholder="Optional context for your team"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
        />
      </label>
    </div>
  );
}
