//IMPORTANT: no longer use this page

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { set } from 'mongoose';

const colors = {
  header: '#3A0000',
  pageBg: '#FAEBDC',
  text: '#2b2b2b',
};

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6v-4.5a7 7 0 1 0-14 0V16l-2 2v1h18v-1l-2-2Z"
        fill={colors.header}
      />
    </svg>
  );
}

interface Client {
  _id: string;
  name: string;
}

interface Carer {
  _id: string;
  name: string;
}

interface Staff {
  _id: string;
  name: string;
  role: 'management' | 'carer';
  email?: string;
  status?: 'active' | 'inactive';
  avatarUrl?: string;
}

export default function ManageCarerPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [carers, setCarers] = useState<Carer[]>([]);
  const [selectedCarerId, setSelectedCarerId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [currentlyAssignedClient, setCurrentlyAssignedClient] =
    useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch clients and carers on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsRes, staffRes] = await Promise.all([
          fetch('/api/v1/management/clients', { cache: 'no-store' }),
          fetch('/api/v1/management/staff', { cache: 'no-store' }),
        ]);

        if (!clientsRes.ok || !staffRes.ok) {
          throw new Error('Failed to fetch data.');
        }

        const clientsData: Client[] = await clientsRes.json();
        const staffData = await staffRes.json();

        const carersData: Carer[] = staffData
          .filter((s: Staff) => s.role === 'carer')
          .map((s: Staff) => ({
            _id: s._id,
            name: s.name,
          }));

        setClients(clientsData);
        setCarers(carersData);
      } catch (error) {
        console.error('Error fetching clients or carers:', error);
        alert('Failed to load clients or carers. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedCarerId) {
      setCurrentlyAssignedClient(null);
      return;
    }

    interface AssignedClientResponse {
      clientId: string;
      name: string;
    }

    async function fetchAssignedClient() {
      try {
        const res = await fetch(`/api/v1/assignments/${selectedCarerId}`, {
          cache: 'no-store',
        });

        if (res.status === 404) {
          setCurrentlyAssignedClient(null);
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to fetch assigned client.');
        }

        const assignedClient: AssignedClientResponse | null = await res.json();

        if (assignedClient && assignedClient.clientId && assignedClient.name) {
          setCurrentlyAssignedClient({
            _id: assignedClient.clientId,
            name: assignedClient.name,
          });
        } else {
          setCurrentlyAssignedClient(null);
        }
      } catch (err) {
        console.error('Error fetching assigned client:', err);
        setCurrentlyAssignedClient(null);
      }
    }

    fetchAssignedClient();
  }, [selectedCarerId]);

  const handleAssign = async () => {
    if (!selectedCarerId || !selectedClientId) {
      alert('Please select both a carer and a client.');
      return;
    }

    try {
      const res = await fetch('/api/v1/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carerId: selectedCarerId,
          clientId: selectedClientId,
        }),
      });

      if (res.ok) {
        alert('Carer assigned successfully!!');
        setSelectedCarerId('');
        setSelectedClientId('');
      } else {
        alert('Failed to assign carer. Please try again.');
      }
    } catch (err) {
      console.error('Error assigning carer:', err);
      alert(
        'An error occurred while assigning the carer. Please try again later.'
      );
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F3E9D9] text-zinc-900">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <DashboardChrome
      page="assign-carer"
      headerTitle="Staff Schedule"
      bannerTitle=""
      showClientPicker={false}
      navItems={[
        { label: 'Staff List', href: '/management_dashboard/staff_list' },
        {
          label: 'Assign Carer',
          href: '/management_dashboard/assign_carer/manage',
        },
      ]}
      colors={{
        header: colors.header,
        banner: colors.pageBg,
        text: colors.text,
      }}
    >
      {/* Hide the print button */}
      <style>{`button:has(> span:contains("Print")){display:none!important;}`}</style>

      {/* Page body */}
      <div
        className="min-h-[calc(100vh-120px)] flex flex-col"
        style={{ background: colors.pageBg }}
      >
        {/* === GAP between top global header and maroon header === */}
        <div className="h-5" style={{ background: colors.pageBg }} />

        {/* === Maroon Header === */}
        <div
          className="w-full flex flex-col items-start text-left"
          style={{ background: colors.header }}
        >
          <div className="px-6 py-4">
            <h1 className="text-white text-2xl font-extrabold text-left">
              Assign Carer to a Client
            </h1>
          </div>
        </div>

        {/* === Pink Banner (separate now) === */}
        <div className="w-full" style={{ background: '#F9C9B1' }}>
          <div className="px-6 md:px-8 py-2 md:py-3 flex items-start gap-3">
            <BellIcon />
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: colors.header }}
            >
              A carer can only be assigned to one client. If you select a new
              client for the carer to be assigned to, the carer will no longer
              have access to their previous client’s care schedule.
            </p>
          </div>
        </div>

        {/* Currently assigned client */}
        <div
          className="w-full flex justify-center"
          style={{ background: colors.pageBg }}
        >
          <p className="text-xl md:text-2xl font-extrabold py-4 text-black">
            Currently Assigned to:{' '}
            <span className="text-black/80">
              {currentlyAssignedClient
                ? currentlyAssignedClient.name
                : 'No Client Assigned'}
            </span>
          </p>
        </div>

        <section className="w-full flex justify-center">
          <div className="w-full max-w-[600px] flex flex-col items-center">
            {/* Carer dropdown */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <label className="font-semibold text-black">Carer:</label>
              <select
                className="h-11 w-56 rounded-md border px-3 bg-white text-black"
                style={{ borderColor: '#3A000044' }}
                value={selectedCarerId}
                onChange={(e) => setSelectedCarerId(e.target.value)}
              >
                <option value="" disabled>
                  Select Carer
                </option>
                {carers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Client dropdown */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <label className="font-semibold text-black">Client:</label>
              <select
                className="h-11 w-56 rounded-md border px-3 bg-white text-black"
                style={{ borderColor: '#3A000044' }}
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="" disabled>
                  Select Client
                </option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={() => router.back()}
                className="px-6 py-2 rounded-md border text-black font-medium hover:bg-black/5"
                style={{ borderColor: '#3A000044' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                className="px-6 py-2 rounded-md text-white font-semibold"
                style={{ background: colors.header }}
              >
                Assign
              </button>
            </div>
          </div>
        </section>
      </div>
    </DashboardChrome>
  );
}
