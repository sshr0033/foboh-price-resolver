import { useState, type ReactNode } from 'react';

export type SectionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

type Props = {
  step: number;
  title: string;
  status: SectionStatus;
  defaultOpen?: boolean;
  children: ReactNode;
};

const STATUS_LABEL: Record<SectionStatus, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const STATUS_CLASSES: Record<SectionStatus, string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-foboh-50 text-foboh-700',
};

export default function SectionShell({
  step,
  title,
  status,
  defaultOpen = true,
  children,
}: Props): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foboh-700 text-white text-xs font-semibold">
            {step}
          </span>
          <h2 className="font-semibold text-slate-900">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CLASSES[status]}`}
          >
            {STATUS_LABEL[status]}
          </span>
          <span className="text-slate-400 text-sm">{open ? '▾' : '▸'}</span>
        </div>
      </button>
      {open ? <div className="px-6 pb-6 pt-2 border-t border-slate-100">{children}</div> : null}
    </section>
  );
}
