import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useListProductsQuery, useListProfilesQuery } from '../store/api';
import ResolverPanel from '../components/resolver/ResolverPanel';
import ProductsBrowser from '../components/ProductsBrowser';
import Modal from '../components/Modal';
import ToastHost from '../components/Toast';
import { formatAUD } from '../utils/debounce';
import type { PricingProfile } from '../types';

type OpenModal = 'products' | 'resolver' | null;

const RECENT_WINDOW_DAYS = 30;
const RECENT_LIST_LIMIT = 5;

function timeAgo(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

function describeOverride(p: PricingProfile): string {
  const o = p.priceOverride;
  if (o.type === 'CUSTOM_PRICE') return `Custom ${formatAUD(o.price)}`;
  const a = o.adjustment;
  const unit = a.mode === 'FIXED' ? `$${a.value}` : `${a.value}%`;
  const sign = a.direction === 'INCREASE' ? '+' : '−';
  return `${a.mode === 'FIXED' ? 'Fixed' : 'Dynamic'} ${sign}${unit}`;
}

function describeScope(p: PricingProfile): string {
  const cs = p.customerScope;
  const ps = p.productScope;
  const customerPart =
    cs.type === 'CUSTOMER'
      ? `customer ${cs.customerId}`
      : cs.type === 'GROUP'
        ? `group ${cs.groupId}`
        : 'all customers';
  const productPart =
    ps.type === 'PRODUCT_LIST'
      ? `${ps.productIds.length} product${ps.productIds.length === 1 ? '' : 's'}`
      : ps.type === 'RULE'
        ? `rule (${Object.entries(ps.filters)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}=${v as string}`)
            .join(', ')})`
        : 'all products';
  return `${customerPart} · ${productPart}`;
}

// ---- Icons (inline SVG, no extra deps) -------------------------------------

function IconPlus(): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-6 h-6"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconBox(): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-6 h-6"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconCompass(): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-6 h-6"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

// ---- Sub-components --------------------------------------------------------

type StatCardProps = { label: string; value: ReactNode; hint: string; loading?: boolean };

function StatCard({ label, value, hint, loading = false }: StatCardProps): JSX.Element {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-3xl font-bold text-slate-900 tabular-nums leading-tight">
        {loading ? <span className="text-slate-300">—</span> : value}
      </span>
      <span className="text-xs text-slate-500">{hint}</span>
    </div>
  );
}

type ActionCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  primary?: boolean;
};

function ActionCard({
  icon,
  title,
  description,
  onClick,
  primary = false,
}: ActionCardProps): JSX.Element {
  const base =
    'group flex flex-col gap-2 text-left rounded-xl p-5 transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foboh-700';
  const cls = primary
    ? `${base} bg-foboh-700 text-white border-foboh-700 hover:bg-foboh-800`
    : `${base} bg-white text-slate-900 border-slate-200 hover:border-foboh-700 hover:shadow-sm`;
  const iconWrap = primary
    ? 'inline-flex w-10 h-10 items-center justify-center rounded-lg bg-white/15 text-white'
    : 'inline-flex w-10 h-10 items-center justify-center rounded-lg bg-foboh-50 text-foboh-700 group-hover:bg-foboh-100';
  const descCls = primary ? 'text-sm text-foboh-50' : 'text-sm text-slate-500';
  return (
    <button type="button" onClick={onClick} className={cls}>
      <span className={iconWrap}>{icon}</span>
      <span className="font-semibold">{title}</span>
      <span className={descCls}>{description}</span>
    </button>
  );
}

type ProfileCardProps = { profile: PricingProfile };

function ProfileCard({ profile }: ProfileCardProps): JSX.Element {
  return (
    <Link
      to="/pricing"
      className="block bg-white border border-slate-200 rounded-lg px-5 py-4 hover:border-foboh-700 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-900 truncate">{profile.name}</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                profile.status === 'ACTIVE'
                  ? 'bg-foboh-50 text-foboh-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {profile.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{describeScope(profile)}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold text-slate-900">{describeOverride(profile)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{timeAgo(profile.updatedAt)}</div>
        </div>
      </div>
    </Link>
  );
}

// ---- Page ------------------------------------------------------------------

export default function PricingListPage(): JSX.Element {
  const navigate = useNavigate();
  const products = useListProductsQuery({});
  const profiles = useListProfilesQuery();
  const [openModal, setOpenModal] = useState<OpenModal>(null);

  const totalProducts = products.data?.items.length ?? 0;
  const allProfiles = profiles.data?.items ?? [];
  const totalProfiles = allProfiles.length;
  const activeProfiles = allProfiles.filter((p) => p.status === 'ACTIVE').length;

  const recentCount = useMemo(() => {
    const cutoff = Date.now() - RECENT_WINDOW_DAYS * 86_400_000;
    return allProfiles.filter((p) => Date.parse(p.updatedAt) >= cutoff).length;
  }, [allProfiles]);

  const recentProfiles = useMemo(
    () =>
      [...allProfiles]
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .slice(0, RECENT_LIST_LIMIT),
    [allProfiles],
  );

  const profilesLoading = profiles.isLoading;
  const productsLoading = products.isLoading;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Pricing</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage bespoke pricing profiles, browse products, and test how the resolver applies
          them.
        </p>
      </header>

      {/* Stats */}
      <section aria-labelledby="stats-heading" className="flex flex-col gap-3">
        <h2 id="stats-heading" className="sr-only">
          Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Products"
            value={totalProducts}
            hint="Active SKUs in the catalogue"
            loading={productsLoading}
          />
          <StatCard
            label="Total Pricing Profiles"
            value={totalProfiles}
            hint="Draft + active combined"
            loading={profilesLoading}
          />
          <StatCard
            label="Active Profiles"
            value={activeProfiles}
            hint="Live and applied at resolve time"
            loading={profilesLoading}
          />
          <StatCard
            label="Recent Profiles"
            value={recentCount}
            hint={`Updated in the last ${RECENT_WINDOW_DAYS} days`}
            loading={profilesLoading}
          />
        </div>
      </section>

      {/* Main Actions */}
      <section aria-labelledby="actions-heading" className="flex flex-col gap-3">
        <h2 id="actions-heading" className="text-sm font-semibold text-slate-700">
          Main actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            icon={<IconPlus />}
            title="Create New Pricing Profile"
            description="Set up a bespoke price for specific customers or product ranges."
            onClick={() => navigate('/pricing/new')}
            primary
          />
          <ActionCard
            icon={<IconBox />}
            title="View Products"
            description="Browse the product catalogue — SKUs, brands, segments, base prices."
            onClick={() => setOpenModal('products')}
          />
          <ActionCard
            icon={<IconCompass />}
            title="Test Pricing Resolver"
            description="Pick a customer and product to see which profile applies, and why."
            onClick={() => setOpenModal('resolver')}
          />
        </div>
      </section>

      {/* Recent Profiles */}
      <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 id="recent-heading" className="text-sm font-semibold text-slate-700">
              Recent profiles
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The {RECENT_LIST_LIMIT} most-recently updated profiles.
            </p>
          </div>
          {totalProfiles > RECENT_LIST_LIMIT ? (
            <span className="text-xs text-slate-500">
              Showing {RECENT_LIST_LIMIT} of {totalProfiles}
            </span>
          ) : null}
        </div>

        {profilesLoading ? (
          <div className="bg-white border border-slate-200 rounded-lg px-5 py-10 text-center text-sm text-slate-500">
            Loading profiles…
          </div>
        ) : profiles.isError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-6 text-center text-sm text-red-700">
            Could not load profiles. Check the backend is running on :4000.
          </div>
        ) : recentProfiles.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-lg px-5 py-10 text-center">
            <p className="text-sm text-slate-500">
              No pricing profiles yet — create one to get started.
            </p>
            <button
              type="button"
              onClick={() => navigate('/pricing/new')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-foboh-700 text-white text-sm font-semibold px-4 py-2 hover:bg-foboh-800 transition"
            >
              <IconPlus />
              New pricing profile
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentProfiles.map((p) => (
              <ProfileCard key={p.id} profile={p} />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <Modal
        open={openModal === 'products'}
        onClose={() => setOpenModal(null)}
        title="Products"
        description="Search and filter the live product catalogue."
        maxWidth="max-w-4xl"
      >
        <ProductsBrowser />
      </Modal>

      <Modal
        open={openModal === 'resolver'}
        onClose={() => setOpenModal(null)}
        title="Test Pricing Resolver"
        description="Pick a customer and product to see which profile applies and the final price."
        maxWidth="max-w-2xl"
      >
        <ResolverPanel embedded />
      </Modal>

      <ToastHost />
    </div>
  );
}
