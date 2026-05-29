import { NavLink } from 'react-router-dom';

const items = [
  { label: 'Dashboard', href: '/dashboard', disabled: true },
  { label: 'Orders', href: '/orders', disabled: true },
  { label: 'Products', href: '/products', disabled: true },
  { label: 'Customers', href: '/customers', disabled: true },
  { label: 'Pricing', href: '/pricing', disabled: false },
  { label: 'Settings', href: '/settings', disabled: true },
];

export default function Sidebar(): JSX.Element {
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 min-h-screen">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-foboh-700 flex items-center justify-center text-white font-bold text-sm">
            F
          </div>
          <span className="font-semibold text-slate-800 tracking-tight">FOBOH</span>
        </div>
      </div>
      <nav className="px-3 pb-6 flex flex-col gap-1">
        {items.map((it) =>
          it.disabled ? (
            <span
              key={it.label}
              className="px-3 py-2 rounded-md text-sm text-slate-400 cursor-not-allowed select-none"
              aria-disabled="true"
            >
              {it.label}
            </span>
          ) : (
            <NavLink
              key={it.label}
              to={it.href}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? 'bg-foboh-50 text-foboh-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              {it.label}
            </NavLink>
          ),
        )}
      </nav>
    </aside>
  );
}
