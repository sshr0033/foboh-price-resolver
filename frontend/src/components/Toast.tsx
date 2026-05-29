import { useEffect, useState } from 'react';

export type ToastMsg = { id: number; text: string; kind: 'success' | 'error' };

let nextId = 1;
const listeners = new Set<(t: ToastMsg) => void>();

export function pushToast(text: string, kind: ToastMsg['kind'] = 'success'): void {
  const msg: ToastMsg = { id: nextId++, text, kind };
  for (const l of listeners) l(msg);
}

export default function ToastHost(): JSX.Element {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  useEffect(() => {
    const handler = (t: ToastMsg): void => {
      setToasts((prev) => [...prev, t]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 3500);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            t.kind === 'success'
              ? 'bg-foboh-700 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
