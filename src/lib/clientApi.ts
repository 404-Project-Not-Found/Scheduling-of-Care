/**
 * Filename: /src/lib/clientApi.ts
 * Author: Qingyue Zhao
 * Date Created: 28/09/2025
 */

export type Client = { 
    _id: string; 
    name: string; 
    dob: string 
    dashboardType?: 'full' | 'partial';
};

export type Organisation = {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'revoked';
};

/** Helper: global flag for mock mode */
export const isMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';

/** Fetch all clients (mock or backend) */
export async function getClientsFE(): Promise<Client[]> {
  // if is mock mode, use frontend hardcode data for testing
  if (isMock) {
    return [
      { _id: 'mock1', name: 'Mock Alice', dob: '1943-09-19', dashboardType: 'full'},
      { _id: 'mock2', name: 'Mock Bob', dob: '1950-01-02', dashboardType: 'partial' },
    ];
  }

  // if not mock, use real backend api
  const res = await fetch('/api/clients', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch clients (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Fetch one client by ID (mock or backend) */
export async function getClientByIdFE(id: string): Promise<Client | null> {
  if (isMock) {
    // just search inside the mock array
    const mockData: Client[] = [
      { _id: 'mock1', name: 'Mock Alice', dob: '1943-09-19' },
      { _id: 'mock2', name: 'Mock Bob', dob: '1950-01-02' },
    ];
    return mockData.find((c) => c._id === id) || null;
  }



  // real backend api
  const res = await fetch(`/api/clients/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as Client;
}

export const MOCK_ORGS: Organisation[] = [
  { id: 'org1', name: 'Sunrise Care', status: 'active' },
  { id: 'org2', name: 'North Clinic', status: 'pending' },
  { id: 'org3', name: 'Old Town Care', status: 'revoked' },
];