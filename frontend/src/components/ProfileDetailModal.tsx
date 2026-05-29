import { useEffect, useState } from 'react';
import Modal from './Modal';
import { pushToast } from './Toast';
import {
  useDeleteProfileMutation,
  useListCustomersQuery,
  useListGroupsQuery,
  useListProductsQuery,
  useUpdateProfileMutation,
} from '../store/api';
import { formatAUD } from '../utils/debounce';
import type { PricingProfile, ProfileStatus } from '../types';

type Mode = 'VIEW' | 'EDIT' | 'CONFIRM_DELETE';

type Props = {
  profile: PricingProfile | null;
  onClose: () => void;
};

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

function statusPillClasses(status: ProfileStatus): string {
  return status === 'ACTIVE'
    ? 'bg-foboh-50 text-foboh-700'
    : 'bg-slate-100 text-slate-600';
}

function describePriceOverride(p: PricingProfile): string {
  const o = p.priceOverride;
  if (o.type === 'CUSTOM_PRICE') return `Custom price: ${formatAUD(o.price)}`;
  const a = o.adjustment;
  const unit = a.mode === 'FIXED' ? `$${a.value}` : `${a.value}%`;
  const sign = a.direction === 'INCREASE' ? '+' : '−';
  const mode = a.mode === 'FIXED' ? 'Fixed' : 'Dynamic';
  return `${mode} adjustment ${sign}${unit}`;
}

export default function ProfileDetailModal({ profile, onClose }: Props): JSX.Element | null {
  const [mode, setMode] = useState<Mode>('VIEW');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<ProfileStatus>('DRAFT');

  const [updateProfile, updateState] = useUpdateProfileMutation();
  const [deleteProfile, deleteState] = useDeleteProfileMutation();

  // Lookups so we can render human-readable names in the scope sections.
  const customers = useListCustomersQuery();
  const groups = useListGroupsQuery();
  const products = useListProductsQuery({});

  // Reset modal sub-mode and edit fields whenever we open a different profile.
  useEffect(() => {
    setMode('VIEW');
    if (profile) {
      setEditName(profile.name);
      setEditDescription(profile.description ?? '');
      setEditStatus(profile.status);
    }
  }, [profile?.id, profile]);

  if (!profile) return null;

  const customerName = (id: string): string =>
    customers.data?.items.find((c) => c.id === id)?.name ?? id;
  const groupName = (id: string): string =>
    groups.data?.items.find((g) => g.id === id)?.name ?? id;
  const productTitle = (id: string): string =>
    products.data?.items.find((p) => p.id === id)?.title ?? id;

  const customerScopeText = ((): string => {
    const cs = profile.customerScope;
    if (cs.type === 'CUSTOMER') return `Specific customer — ${customerName(cs.customerId)}`;
    if (cs.type === 'GROUP') return `Group — ${groupName(cs.groupId)}`;
    return 'All customers';
  })();

  const productScopeText = ((): string => {
    const ps = profile.productScope;
    if (ps.type === 'PRODUCT_LIST') {
      const titles = ps.productIds.slice(0, 3).map(productTitle);
      const extra = ps.productIds.length > 3 ? ` (+${ps.productIds.length - 3} more)` : '';
      return `${ps.productIds.length} product${ps.productIds.length === 1 ? '' : 's'} — ${titles.join(', ')}${extra}`;
    }
    if (ps.type === 'RULE') {
      const parts = Object.entries(ps.filters)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}=${v as string}`)
        .join(', ');
      return `Rule — ${parts}`;
    }
    return 'All products';
  })();

  const handleClose = (): void => {
    setMode('VIEW');
    onClose();
  };

  const handleToggleStatus = async (): Promise<void> => {
    const newStatus: ProfileStatus = profile.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    try {
      await updateProfile({ id: profile.id, patch: { status: newStatus } }).unwrap();
      pushToast(
        newStatus === 'ACTIVE' ? 'Profile activated.' : 'Profile deactivated.',
        'success',
      );
      handleClose();
    } catch (err) {
      const msg = (err as { data?: { error?: string } }).data?.error ?? 'Unknown error';
      pushToast(`Update failed: ${msg}`, 'error');
    }
  };

  const handleSaveEdit = async (): Promise<void> => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      pushToast('Profile name is required.', 'error');
      return;
    }
    try {
      await updateProfile({
        id: profile.id,
        patch: {
          name: trimmedName,
          description: editDescription.trim() || undefined,
          status: editStatus,
        },
      }).unwrap();
      pushToast('Profile updated.', 'success');
      handleClose();
    } catch (err) {
      const msg = (err as { data?: { error?: string } }).data?.error ?? 'Unknown error';
      pushToast(`Update failed: ${msg}`, 'error');
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    try {
      await deleteProfile({ id: profile.id }).unwrap();
      pushToast('Profile deleted.', 'success');
      handleClose();
    } catch (err) {
      const msg = (err as { data?: { error?: string } }).data?.error ?? 'Unknown error';
      pushToast(`Delete failed: ${msg}`, 'error');
    }
  };

  const busy = updateState.isLoading || deleteState.isLoading;

  const title =
    mode === 'EDIT'
      ? 'Edit profile'
      : mode === 'CONFIRM_DELETE'
        ? 'Delete profile?'
        : 'Profile details';

  return (
    <Modal open onClose={handleClose} title={title} maxWidth="max-w-2xl">
      {mode === 'VIEW' ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 break-words">{profile.name}</h3>
              {profile.description ? (
                <p className="text-sm text-slate-500 mt-1">{profile.description}</p>
              ) : null}
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide shrink-0 ${statusPillClasses(profile.status)}`}
            >
              {profile.status}
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Customer scope
              </dt>
              <dd className="mt-1 text-sm text-slate-800">{customerScopeText}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Product scope
              </dt>
              <dd className="mt-1 text-sm text-slate-800">{productScopeText}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Price override
              </dt>
              <dd className="mt-1 text-sm text-slate-800 font-medium">
                {describePriceOverride(profile)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Profile ID
              </dt>
              <dd className="mt-1 text-xs font-mono text-slate-500 break-all">{profile.id}</dd>
            </div>
          </dl>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
            <div>
              Created {new Date(profile.createdAt).toLocaleDateString('en-AU')}
            </div>
            <div>
              Updated {new Date(profile.updatedAt).toLocaleDateString('en-AU')} ·{' '}
              {timeAgo(profile.updatedAt)}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 flex-wrap">
            <button
              type="button"
              onClick={() => setMode('CONFIRM_DELETE')}
              disabled={busy}
              className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline disabled:text-slate-400 disabled:no-underline"
            >
              Delete
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => void handleToggleStatus()}
                disabled={busy}
                className="rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-semibold px-3.5 py-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {updateState.isLoading
                  ? 'Working…'
                  : profile.status === 'ACTIVE'
                    ? 'Deactivate'
                    : 'Activate'}
              </button>
              <button
                type="button"
                onClick={() => setMode('EDIT')}
                disabled={busy}
                className="rounded-md bg-foboh-700 text-white text-sm font-semibold px-3.5 py-2 hover:bg-foboh-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                Update
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="rounded-md text-slate-600 text-sm font-medium px-3.5 py-2 hover:bg-slate-100 disabled:opacity-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : mode === 'EDIT' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSaveEdit();
          }}
          className="flex flex-col gap-5"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Profile name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-foboh-700 focus:ring-1 focus:ring-foboh-700 outline-none resize-none"
            />
          </label>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-medium text-slate-700">Status</legend>
            <div className="inline-flex rounded-md border border-slate-300 overflow-hidden text-sm bg-white w-fit">
              <button
                type="button"
                onClick={() => setEditStatus('DRAFT')}
                aria-pressed={editStatus === 'DRAFT'}
                className={`px-4 py-2 font-medium transition ${
                  editStatus === 'DRAFT'
                    ? 'bg-foboh-700 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setEditStatus('ACTIVE')}
                aria-pressed={editStatus === 'ACTIVE'}
                className={`px-4 py-2 font-medium transition border-l border-slate-300 ${
                  editStatus === 'ACTIVE'
                    ? 'bg-foboh-700 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Active
              </button>
            </div>
          </fieldset>

          <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
            <strong className="text-slate-700">Scope &amp; pricing are read-only here.</strong>{' '}
            To change the customer scope, product scope, or price override, delete this profile
            and create a new one.
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setMode('VIEW')}
              disabled={updateState.isLoading}
              className="rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-semibold px-4 py-2 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateState.isLoading || !editName.trim()}
              className="rounded-md bg-foboh-700 text-white text-sm font-semibold px-4 py-2 hover:bg-foboh-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
            >
              {updateState.isLoading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        // CONFIRM_DELETE
        <div className="flex flex-col gap-4">
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold mb-1">This cannot be undone.</p>
            <p>
              Delete <strong>&ldquo;{profile.name}&rdquo;</strong>? Any pricing decisions that
              this profile would have made will revert to whichever lower-specificity profile
              applies, or to the base price.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setMode('VIEW')}
              disabled={deleteState.isLoading}
              className="rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-semibold px-4 py-2 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmDelete()}
              disabled={deleteState.isLoading}
              className="rounded-md bg-red-600 text-white text-sm font-semibold px-4 py-2 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition"
            >
              {deleteState.isLoading ? 'Deleting…' : 'Yes, delete'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
