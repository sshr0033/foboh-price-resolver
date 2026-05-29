import { useMemo } from 'react';
import { useListCustomersQuery, useListGroupsQuery } from '../../store/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedCustomers } from '../../store/pricingWizardSlice';
import type { Customer } from '../../types';

const UNGROUPED = '__ungrouped__';

export default function AssignCustomersSection(): JSX.Element {
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector((s) => s.pricingWizard.selectedCustomerIds);

  const customers = useListCustomersQuery();
  const groups = useListGroupsQuery();

  const { groupNameById, byGroup } = useMemo(() => {
    const groupNameById = new Map<string, string>();
    for (const g of groups.data?.items ?? []) groupNameById.set(g.id, g.name);
    const byGroup = new Map<string, Customer[]>();
    for (const c of customers.data?.items ?? []) {
      const primary = c.groupIds[0] ?? UNGROUPED;
      const arr = byGroup.get(primary) ?? [];
      arr.push(c);
      byGroup.set(primary, arr);
    }
    return { groupNameById, byGroup };
  }, [customers.data, groups.data]);

  if (customers.isLoading || groups.isLoading) {
    return <div className="text-sm text-slate-500 py-4">Loading customers…</div>;
  }
  if (customers.isError || groups.isError) {
    return (
      <div className="text-sm text-red-600 py-4">
        Could not load customers. Check the backend is running on :4000.
      </div>
    );
  }

  const selectedSet = new Set(selectedIds);

  const toggle = (id: string): void => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    dispatch(setSelectedCustomers(Array.from(next)));
  };

  const groupEntries = Array.from(byGroup.entries()).sort(([a], [b]) => {
    if (a === UNGROUPED) return 1;
    if (b === UNGROUPED) return -1;
    const an = groupNameById.get(a) ?? a;
    const bn = groupNameById.get(b) ?? b;
    return an.localeCompare(bn);
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        Choose which customers this pricing profile applies to. Customers are grouped by their
        primary group for legibility — saving as <strong>Draft</strong> works with no customers,
        but saving as <strong>Active</strong> requires at least one.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groupEntries.map(([groupId, list]) => {
          const groupName =
            groupId === UNGROUPED ? 'Ungrouped' : (groupNameById.get(groupId) ?? groupId);
          return (
            <fieldset
              key={groupId}
              className="border border-slate-200 rounded-lg p-4 flex flex-col gap-2"
            >
              <legend className="px-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {groupName}
              </legend>
              {list.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-slate-50 rounded px-1.5 py-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedSet.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="h-4 w-4 rounded border-slate-300 text-foboh-700 focus:ring-foboh-700"
                  />
                  <span className="text-slate-800">{c.name}</span>
                  <span className="text-xs text-slate-400 ml-auto">
                    {c.groupIds
                      .map((id: string) => groupNameById.get(id) ?? id)
                      .join(', ') || '—'}
                  </span>
                </label>
              ))}
            </fieldset>
          );
        })}
      </div>
      <div className="text-xs text-slate-500">
        {selectedIds.length} customer{selectedIds.length === 1 ? '' : 's'} selected.
      </div>
    </div>
  );
}
