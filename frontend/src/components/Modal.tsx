import { useEffect, type ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Tailwind max-width class. Defaults to a medium-wide dialog. */
  maxWidth?: string;
  /**
   * Classes for the body wrapper. Default makes the body scroll + pad.
   * Pass a flex-column (non-scrolling) class when the child wants to manage
   * its own scroll region + a pinned footer.
   */
  bodyClassName?: string;
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-3xl',
  bodyClassName = 'flex-1 overflow-y-auto p-6',
}: Props): JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-20"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-default"
      />
      <div
        className={`relative bg-white rounded-xl shadow-xl w-full ${maxWidth} max-h-[85vh] flex flex-col`}
      >
        <header className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description ? (
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-900 rounded-md w-8 h-8 flex items-center justify-center hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </header>
        <div className={bodyClassName}>{children}</div>
      </div>
    </div>
  );
}
