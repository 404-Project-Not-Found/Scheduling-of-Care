/**
 * File path: /family_dashboard/manage_org_access/[clientId]/page.tsx
 * Front-end Author: Qingyue Zhao
 * Back-end Author: Denise Alexander
 *
 * Updated by Denise Alexander (7/10/2025): back-end integrated to implement
 * organisation access workflow.
 *
 * Last Updated by Denise Alexander (20/10/2025): UI design and layout changes for readability,
 * consistency and better navigation.
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
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { useRouter } from 'next/navigation';
import { useActiveClient } from '@/context/ActiveClientContext';
import { getClients, type Client as ApiClient } from '@/lib/data';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const colors = {
  pageBg: '#ffd9b3',
  header: '#3A0000',
  notice: '#F9C9B1',
  text: '#2b2b2b',
};

type ClientLite = { id: string; name: string };

type Organisation = {
  id: string;
  name: string;
  status: 'approved' | 'pending' | 'revoked';
};

export default function ManageOrganisationAccessPage() {
  const router = useRouter();
  const { client: activeClient, handleClientChange } = useActiveClient();

  // ---------- Clients ----------
  const [clients, setClients] = useState<ClientLite[]>([]);

  // ---------- Organisations ----------
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Load clients and restore active selection
  useEffect(() => {
    (async () => {
      try {
        const list: ApiClient[] = await getClients();
        setClients(list.map((c) => ({ id: c._id, name: c.name })));
      } catch (err) {
        console.error('Failed to load clients:', err);
        setClients([]);
      }
    })();
  }, []);

  // Load organisation access list for current client
  useEffect(() => {
    if (!activeClient?.id) {
      setOrgs([]);
      setErrorText('No client selected yet.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/v1/clients/${activeClient.id}/organisations`,
          { cache: 'no-store' }
        );
        if (!res.ok) {
          throw new Error('Failed to fetch organisations.');
        }
        const data = await res.json();
        setOrgs(data);
      } catch (err) {
        console.error(err);
        setErrorText('Failed to load organisations.');
        setOrgs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeClient]);

  // Update org status (approve/reject/revoke)
  async function updateOrgStatus(
    orgId: string,
    action: 'approve' | 'reject' | 'revoke'
  ) {
    if (!activeClient?.id) return;

    setLoading(true);
    setErrorText(null);

    try {
      const res = await fetch(
        `/api/v1/clients/${activeClient.id}/organisations/${orgId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      );
      if (!res.ok) {
        throw new Error('Failed to update organisation.');
      }

      const orgRes = await fetch(
        `/api/v1/clients/${activeClient.id}/organisations`,
        { cache: 'no-store' }
      );
      if (!orgRes.ok) {
        throw new Error('Failed to fetch organisations.');
      }
      const orgData = await orgRes.json();
      setOrgs(orgData);
    } catch (err) {
      console.error(err);
      setErrorText('Failed to update organisation.');
    } finally {
      setLoading(false);
    }
  }

  // Handle client change from dropdown
  const onClientChange = (id: string) => {
    const selected = clients.find((c) => c.id === id);
    if (!selected) return;
    if (selected && activeClient?.id !== selected.id) {
      handleClientChange(selected.id, selected.name);
    }
  };

  const chromeClients = useMemo(() => clients, [clients]);

  return (
    <DashboardChrome
      page="organisation-access"
      clients={chromeClients}
      onClientChange={onClientChange}
      colors={{
        header: colors.header,
        banner: colors.notice,
        text: colors.text,
      }}
    >
      {/* Page body */}
      <div className="flex-1 min-h-screen bg-[#FFF5EC] overflow-auto">
        <div className="w-full px-6 py-5">
          {/* Section header with back button */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#3A0000] text-3xl font-semibold">
              Manage Organisation Access
            </h2>
            <button
              onClick={() => router.push('/family_dashboard/people_list')}
              className="flex items-center gap-2 text-lg font-semibold text-[#3A0000] bg-[#EAD8C8] hover:bg-[#DFC8B4] border border-[#D4B8A0] rounded-md px-4 py-2 transition"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
              Back
            </button>
          </div>

          {/* Divider */}
          <hr className="mt-4 mb-4 w-340 mx-auto border-t border-[#3A0000]/25 rounded-full" />

          {/* Privacy Notice Banner */}
          <div className="mt-6 mb-4 mx-auto flex items-start gap-4 bg-[#F9C9B1]/60 border border-[#3A0000]/30 rounded-xl px-6 py-4 shadow-sm">
            <AlertCircle
              size={28}
              strokeWidth={2.5}
              className="text-[#3A0000] flex-shrink-0 mt-1"
            />
            <div className="text-[#3A0000]">
              <h3 className="text-lg font-semibold mb-1">Privacy Notice</h3>
              <p className="text-base leading-relaxed">
                This information is only visible to you (Family / POA) and will
                not be shared with anyone else.
              </p>
            </div>
          </div>

          {/* Legend Section */}
          <div className="mb-3 mx-auto">
            <Legend className="pl-1" />
          </div>

          {/* Content area */}
          <div className="w-full rounded-xl border border-[#3A0000]/25 bg-white p-4">
            {loading ? (
              <div className="text-black/70">Loading…</div>
            ) : errorText ? (
              <div className="text-red-600">{errorText}</div>
            ) : (
              <>
                <Group
                  title="Organisations with Access"
                  items={orgs.filter((o) => o.status === 'approved')}
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
              <div className="flex items-center gap-3">
                {item.status === 'approved' && onRevoke && (
                  <button
                    onClick={() => onRevoke(item.id)}
                    className="px-4 py-1.5 rounded-md text-lg font-semibold text-white transition hover:opacity-90"
                    style={{
                      backgroundColor: '#D57A2E',
                      border: '1px solid #B86A1F',
                    }}
                  >
                    Revoke
                  </button>
                )}
                {item.status === 'pending' && (
                  <>
                    {onApprove && (
                      <button
                        onClick={() => onApprove(item.id)}
                        className="px-4 py-1.5 rounded-md text-lg font-semibold text-white transition hover:opacity-90"
                        style={{
                          backgroundColor: '#4CAF50',
                          border: '1px solid #3D8B41',
                        }}
                      >
                        Approve
                      </button>
                    )}
                    {onRemove && (
                      <button
                        onClick={() => onRemove(item.id)}
                        className="px-4 py-1.5 rounded-md text-lg font-semibold text-white transition hover:opacity-90"
                        style={{
                          backgroundColor: '#E53935',
                          border: '1px solid #C62828',
                        }}
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

function Legend({ className = '' }: { className?: string }) {
  const legendItems = [
    {
      action: 'Approve',
      description: 'Gives organisation access to client',
      style: {
        backgroundColor: '#4CAF50',
        color: 'white',
        border: '1px solid #3D8B41',
      },
    },
    {
      action: 'Reject',
      description: 'Rejects organisation request to client access',
      style: {
        backgroundColor: '#E53935',
        color: 'white',
        border: '1px solid #C62828',
      },
    },
    {
      action: 'Revoke',
      description: 'Removes organisation access to client',
      style: {
        backgroundColor: '#D57A2E',
        color: 'white',
        border: '1px solid #B86A1F',
      },
    },
  ];

  return (
    <div
      className={`mb-4 flex justify-start gap-6 text-sm flex-wrap px-6 ${className}`}
    >
      {legendItems.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded-md text-sm font-semibold cursor-default transition"
            style={item.style}
          >
            {item.action}
          </button>
          <span className="text-[#3A0000]/90">{item.description}</span>
        </div>
      ))}
    </div>
  );
}
