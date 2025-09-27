/**
 * Filename: /family_dashboard/manage_organisation_access/[clientId]/ManageAccessInner.tsx
 * Authors: Qingyue Zhao and Denise Alexander
 * Date Created: 17/09/2025
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type OrgStatus = 'active' | 'pending' | 'revoked';

interface ClientDoc {
  id: string;
  name: string;
}

interface Organisation {
  id: string;
  name: string;
  status: OrgStatus;
}

const palette = {
  pageBg: '#ffd9b3', // page background
  header: '#3A0000', // dark brown
  banner: '#F9C9B1', // notice banner
  panelBg: '#fdf4e7', // panel background
};

export default function ManageAccessInner({
  client,
  initialOrgs,
}: {
  client: ClientDoc;
  initialOrgs: Organisation[];
}) {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organisation[]>(initialOrgs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Updates local UI state to reflect changes optimistically
  async function updateOrgStatus(
    orgId: string,
    action: 'approve' | 'reject' | 'revoke'
  ) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/clients/${client.id}/organisations/${orgId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update organisations.');
      }

      setOrgs((prev) =>
        prev.map((o) =>
          o.id === orgId
            ? { ...o, status: action === 'approve' ? 'active' : 'revoked' }
            : o
        )
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading organisations...</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div
      className="min-h-screen w-full relative"
      style={{ backgroundColor: palette.pageBg }}
    >
      {/* Logo */}
      <div className="absolute top-8 left-8 w-64 h-32">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={256}
          height={128}
          className="object-contain"
          priority
        />
      </div>

      <div className="flex justify-center pt-20">
        {/* Note: Tailwind does not have pt-25; use pt-20 or pt-24 */}
        <div className="scale-100 origin-top w-full">
          <div
            className="w-full max-w-3xl md:max-w-4xl mx-auto rounded-2xl shadow-lg overflow-hidden"
            style={{ backgroundColor: palette.panelBg }}
          >
            {/* Header */}
            <div
              className="px-5 py-5 flex items-center justify-center relative"
              style={{ backgroundColor: palette.header }}
            >
              <button
                onClick={() => router.push('/family_dashboard/clients_list')}
                className="absolute left-5 flex items-center gap-1 text-white hover:text-gray-200 transition"
              >
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                <span className="font-medium">Back</span>
              </button>

              <h1 className="text-3xl font-bold text-white">
                Manage Organisation Access
              </h1>
            </div>

            {/* Client name */}
            <div className="px-5 py-4 text-center text-2xl font-bold text-black">
              Client:&nbsp;{client ? client.name : 'Loading...'}
            </div>

            {/* Privacy notice */}
            <div
              className="px-5 py-2"
              style={{ backgroundColor: palette.banner }}
            >
              <p className="text-base font-semibold text-black/90">
                Privacy Notice: This information is visible only to you, as the
                family member or power of attorney for this person, and will not
                be shared with anyone.
              </p>
            </div>

            {/* Organisations list */}
            <div className="p-5 mx-5 mt-5 mb-3 rounded border shadow-sm max-h-[320px] overflow-y-auto text-black bg-white">
              <Group
                title="Organisations with Access"
                items={orgs.filter((o) => o.status === 'active')}
                onRevoke={(id) => updateOrgStatus(id, 'revoke')}
              />
              <hr className="my-4" />
              <Group
                title="Organisations with Access Pending"
                items={orgs.filter((o) => o.status === 'pending')}
                onApprove={(id) => updateOrgStatus(id, 'approve')}
                onRemove={(id) => updateOrgStatus(id, 'reject')}
              />
              <hr className="my-4" />
              <Group
                title="Revoked Organisations"
                items={orgs.filter((o) => o.status === 'revoked')}
              />
            </div>

            {/* Save & Return */}
            <div className="flex justify-center pt-2 pb-6">
              <button
                className="text-white font-semibold px-8 py-3 rounded-md hover:bg-[#3a0808] transition-colors"
                style={{ backgroundColor: palette.header }}
                onClick={() => router.push('/family_dashboard/clients_list')}
              >
                Return
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help bubble */}
      <div className="fixed bottom-6 right-6 transform scale-90 origin-bottom-right">
        <div className="relative">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl cursor-pointer"
            style={{ backgroundColor: '#ff9900', color: '#fff' }}
            onMouseEnter={(e) =>
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }
            onMouseLeave={(e) =>
              e.currentTarget.nextElementSibling?.classList.add('hidden')
            }
            aria-label="Help"
            title="Help"
          >
            ?
          </div>
          <div className="hidden absolute bottom-16 right-0 w-80 bg-white border border-gray-300 p-4 rounded shadow-lg text-sm z-50 text-black">
            <h4 className="font-semibold mb-2">How to use this page</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>View all organisations and their access status.</li>
              <li>Approve pending organisations or revoke access as needed.</li>
              <li>
                Click <b>Save &amp; Return</b> to confirm changes.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Reusable group component */
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
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-base">{title}</div>
      </div>

      <div className="space-y-2 text-base text-black">
        {items.length === 0 && <div className="text-slate-500">None</div>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div>{item.name}</div>
            <div className="flex items-center gap-3">
              {item.status === 'active' && onRevoke && (
                <button
                  onClick={() => onRevoke(item.id)}
                  className="px-3 py-1 rounded text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  Revoke
                </button>
              )}
              {item.status === 'pending' && (
                <>
                  {onApprove && (
                    <button
                      onClick={() => onApprove(item.id)}
                      className="px-3 py-1 rounded text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  {onRemove && (
                    <button
                      onClick={() => onRemove(item.id)}
                      className="px-3 py-1 rounded text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
