/**
 * File path: /family_dashboard/manage_organisation_access/page.tsx
 * Authors: Qingyue Zhao & Denise Alexander
 * Last Update: 2025-10-03
 *
 * NOTE:
 * This page has been refactored to allow families to select the active client
 * directly from the shared DashboardChrome banner dropdown, similar to other
 * family pages. The backend API will need to be adjusted accordingly since
 * it previously relied on a clientId parameter from the dynamic route.
 *
 * Changes:
 * - Removed [clientId] dynamic routing, page can be accessed directly.
 * - Uses DashboardChrome with a client dropdown for selection.
 * - On client change, updates activeClient in storage and reloads orgs.
 * - Organisation access workflow is still stubbed with mock data (MOCK_ORGS);
 *   backend fetch should be integrated once available.
 *
 * Old files move to: app/old_organisation_access
 *
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardChrome from '@/components/top_menu/client_schedule';

import {
  isMock,
  MOCK_ORGS,
  type Organisation,
  type Client as ApiClient,
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
} from '@/lib/mock/mockApi';

const colors = {
  pageBg: '#ffd9b3',
  header: '#3A0000',
  notice: '#F9C9B1',
  text: '#2b2b2b',
};

type ClientLite = { id: string; name: string };

export default function ManageOrganisationAccessPage() {
  // ---------- Clients & Selection ----------
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activeClientName, setActiveClientName] = useState<string>('');

  // ---------- Organisations ----------
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Load clients and restore active selection
  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE(); // Returns ApiClient[]
        const mapped: ClientLite[] = list.map((c: ApiClient) => ({
          id: c._id,
          name: c.name,
        }));
        setClients(mapped);

        const { id, name } = readActiveClientFromStorage();
        const useId = id || mapped[0]?.id || null;
        const useName =
          name || (mapped.find((m) => m.id === useId)?.name ?? '');
        setActiveClientId(useId);
        setActiveClientName(useName);
      } catch {
        setClients([]);
      }
    })();
  }, []);

  // Load organisation access list for current client
  useEffect(() => {
    if (!activeClientId) {
      setOrgs([]);
      return;
    }
    (async () => {
      setLoading(true);
      setErrorText(null);
      try {
        if (isMock) {
          setOrgs(MOCK_ORGS);
        } else {
          // TODO: Replace with backend API once available
          // const res = await fetch(`/api/v1/clients/${activeClientId}/organisations`, { cache: 'no-store' });
          // const data = await res.json();
          // setOrgs(data as Organisation[]);
          setOrgs([]);
        }
      } catch {
        setErrorText('Failed to load organisations.');
        setOrgs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeClientId]);

  // Handle client change from dropdown
  const onClientChange = (id: string) => {
    const c = clients.find((x) => x.id === id) || null;
    const name = c?.name || '';
    setActiveClientId(id || null);
    setActiveClientName(name);
    writeActiveClientToStorage(id || '', name);
  };

  // Update org status (approve/reject/revoke)
  async function updateOrgStatus(
    orgId: string,
    action: 'approve' | 'reject' | 'revoke'
  ) {
    if (!activeClientId) return;
    if (isMock) {
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === orgId
            ? { ...o, status: action === 'approve' ? 'active' : 'revoked' }
            : o
        )
      );
      return;
    }
    try {
      setLoading(true);
      // TODO: Integrate backend call once ready
      // await fetch(`/api/v1/clients/${activeClientId}/organisations/${orgId}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ action }),
      // });
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === orgId
            ? { ...o, status: action === 'approve' ? 'active' : 'revoked' }
            : o
        )
      );
    } catch {
      setErrorText('Failed to update organisation.');
    } finally {
      setLoading(false);
    }
  }

  const chromeClients = useMemo(() => clients, [clients]);

  return (
    <DashboardChrome
      page="organisation-access"
      clients={chromeClients}
      activeClientId={activeClientId}
      onClientChange={onClientChange}
      activeClientName={activeClientName}
      colors={{
        header: colors.header,
        banner: colors.notice,
        text: colors.text,
      }}
    >
      {/* Page body */}
      <div className="w-full h-full" style={{ backgroundColor: colors.pageBg }}>
        <div className="w-full h-full">
          {/* Section header with back button */}
          <div
            className="w-full px-6 py-4 flex items-center justify-between text-white text-2xl md:text-3xl font-extrabold"
            style={{ backgroundColor: colors.header }}
          >
            <span>Manage Organisation Access</span>
          </div>

          {/* Content area */}
          <div
            className="w-full h-[630px] rounded-b-xl bg-[#f6efe2] border-x border-b flex flex-col"
            style={{ borderColor: 'transparent' }}
          >
            {/* Notice bar */}
            <div
              className="w-full px-5 py-3 text-black"
              style={{ backgroundColor: colors.notice }}
            >
              <p className="text-center font-semibold">
                Privacy Notice: This information is visible only to you (family
                / POA) and will not be shared with anyone.
              </p>
            </div>

            {/* Lists */}
            <div className="flex-1 px-6 py-6 pb-6 overflow-auto text-black">
              {loading ? (
                <div className="text-black/70">Loading…</div>
              ) : errorText ? (
                <div className="text-red-600">{errorText}</div>
              ) : (
                <>
                  <Group
                    title="Organisations with Access"
                    items={orgs.filter((o) => o.status === 'active')}
                    onRevoke={(id) => updateOrgStatus(id, 'revoke')}
                  />
                  <hr className="my-5 border-black" />
                  <Group
                    title="Organisations who have Requested Access"
                    items={orgs.filter((o) => o.status === 'pending')}
                    onApprove={(id) => updateOrgStatus(id, 'approve')}
                    onRemove={(id) => updateOrgStatus(id, 'reject')}
                  />
                  <hr className="my-5 border-black" />
                  <Group
                    title="Revoked Organisations"
                    items={orgs.filter((o) => o.status === 'revoked')}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}

/* ---------- Group list block ---------- */
function Group({
  title,
  items,
  onRevoke,
  onRemove,
  onApprove,
}: {
  title: string;
  items: Organisation[];
  onRevoke?: (id: string) => void;
  onRemove?: (id: string) => void;
  onApprove?: (id: string) => void;
}) {
  return (
    <section className="text-base">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>

      {items.length === 0 ? (
        <div className="text-slate-600">None</div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex text-lg items-center justify-between"
            >
              <div>{item.name}</div>
              <div className="flex items-center gap-3 ">
                {item.status === 'active' && onRevoke && (
                  <button
                    onClick={() => onRevoke(item.id)}
                    className="px-4 py-1.5 rounded-xl text-lg font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                  >
                    Revoke
                  </button>
                )}
                {item.status === 'pending' && (
                  <>
                    {onApprove && (
                      <button
                        onClick={() => onApprove(item.id)}
                        className="px-4 py-1.5 rounded-xl text-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {onRemove && (
                      <button
                        onClick={() => onRemove(item.id)}
                        className="px-4 py-1.5 rounded-xl text-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
