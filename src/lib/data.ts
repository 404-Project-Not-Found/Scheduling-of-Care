/**
 * File path: /lib/data.ts
 * Author: Denise Alexander
 * Date Created: 04/10/2025
 *
 * Updated by Denise Alexander - 7/10/2025: enables either mock mode or real back-end API.
 * Updated by Zahra Rizqita - 13/10/2025: implement fetching and saving task.
 * Updated by Denise Alexander - 16/10/2025: added new helper functions for family
 * requests handling.
 *
 * Last Updated by Denise Alexander - 20/10/2025: added new function that retrieves users who
 * have access to a client.
 */

import * as mockApi from './mock/mockApi';
import { getSession } from 'next-auth/react';
import { mockSignOut } from './mock/mockSignout';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import {
  toISODateOnly,
  nextOccurrenceAfterToday,
} from '@/lib/care-item-helpers/date-helpers';

// Fetching Task helper
export type ApiCareItem = {
  slug: string;
  label: string;
  category?: string;
  status: 'Pending' | 'Due' | 'Completed';
  frequency?: string;
  lastDone?: string;
  nextDue?: string;
  clientId?: string;
  comments?: string[];
  files?: string[];
};

export interface AccessUser {
  _id: string;
  fullName: string;
  email: string;
  role: 'carer' | 'family' | 'management';
}

export interface Task {
  id: string;
  title: string;
  category: string;
  description?: string;
}

type CareItemListRow = {
  label: string;
  slug: string;
  status: 'Pending' | 'Overdue' | 'Completed';
  category: string;
  categoryId?: string;
  clientId?: string;
  deleted?: boolean;
  frequency?: string;
  lastDone?: string;
  frequencyDays?: number;
  frequencyCount?: number;
  frequencyUnit?: 'day' | 'week' | 'month' | 'year';
  dateFrom?: string;
  dateTo?: string;
  notes?: string;
};

// Flag to determine whether to use mock API or real back-end
const isMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';

// Signs out the currently logged-in user
export const signOutUser = async () => {
  if (isMock) {
    mockSignOut();
    return;
  }
  await nextAuthSignOut({ redirect: false });
};

// Gets all users who have access to a client
export const getUsersWithAccess = async (
  clientId: string
): Promise<AccessUser[]> => {
  if (!clientId) return [];

  const res = await fetch(`/api/v1/clients/${clientId}/access`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch users with access (${res.status})`);
  }

  const data = await res.json();
  return data;
};

// Gets the role of the currently authenticated user
export const getViewerRole = async (): Promise<
  'carer' | 'family' | 'management'
> => {
  if (isMock) {
    return mockApi.getViewerRoleFE();
  }

  const session = await getSession();
  if (!session?.user?.role) {
    return 'carer'; // fallback
  }
  return session.user.role as 'carer' | 'family' | 'management';
};

// Fetches all clients visible to the current user
export const getClients = async (): Promise<mockApi.Client[]> => {
  if (isMock) {
    return mockApi.getClientsFE();
  }

  const session = await getSession();
  if (!session?.user?.id || !session?.user?.role) {
    return [];
  }

  const role = session.user.role;
  const url =
    role === 'management' || role === 'carer'
      ? '/api/v1/management/clients'
      : '/api/v1/clients';

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch clients (${res.status})`);
  }

  return (await res.json()) as mockApi.Client[];
};

// Fetches a specific client by ID
export const getClientById = async (id: string) => {
  if (isMock) {
    return mockApi.getClientByIdFE(id);
  }
  const res = await fetch(`/api/v1/clients/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as mockApi.Client;
};

// Fetches all tasks visible to the current user
export const getTasks = async (): Promise<mockApi.Task[]> => {
  if (isMock) {
    return mockApi.getTasksFE();
  }

  const buildFrequency = (row: CareItemListRow): string => {
    if (row.frequency && row.frequency.trim()) return row.frequency;
    if (row.frequencyCount && row.frequencyUnit) {
      const unit =
        row.frequencyCount === 1 ? row.frequencyUnit : `${row.frequencyUnit}s`;
      return `Every ${row.frequencyCount} ${unit}`;
    }
    if (row.frequencyDays && row.frequencyDays > 0) {
      const unit = row.frequencyDays === 1 ? 'day' : 'days';
      return `Every ${row.frequencyDays} ${unit}`;
    }
    return '';
  };

  const res = await fetch('/api/v1/care_item?limit=200', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks (${res.status})`);
  }

  const rows: CareItemListRow[] = await res.json();

  const tasks: mockApi.Task[] = rows.map((row, idx) => {
    const id = row.slug || `task-${idx}`;

    const task: mockApi.Task = {
      id,
      title: row.label,
      status: row.status,
      category: row.category,
      clientId: row.clientId ?? '',
      frequency: buildFrequency(row),
      lastDone: toISODateOnly(row.lastDone ?? null) || '',
      nextDue: nextOccurrenceAfterToday(
        toISODateOnly(row.dateFrom),
        row.frequencyCount,
        row.frequencyUnit,
        row.frequencyDays
      ),
      comments: [],
      files: [],
    };

    return task;
  });

  return tasks;
};

// Saves the provided list of tasks
export const saveTasks = async (tasks: mockApi.Task[]) => {
  if (isMock) {
    return mockApi.saveTasksFE(tasks);
  }

  const deriveNextDue = (row: CareItemListRow): string => {
    if (row.dateTo && row.dateTo.trim()) return row.dateTo;
    if (row.dateFrom && row.dateFrom.trim()) return row.dateFrom;
    return '';
  };

  const res = await fetch('/api/v1/care_item?limit=200', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks (${res.status})`);
  }
};

// Gets the client the logged-in user is currently viewing
export const getActiveClient = async (): Promise<{
  id: string | null;
  name: string;
  hasClients: boolean;
}> => {
  const clients = await getClients();
  // No clients yet
  if (!clients.length) {
    return { id: null, name: '', hasClients: false };
  }

  // Mock mode: check local storage first
  if (isMock) {
    const active = mockApi.readActiveClientFromStorage();
    if (active.id) {
      return { ...active, hasClients: true };
    }
    return { id: clients[0]._id, name: clients[0].name, hasClients: true };
  }

  // Real API: query backend for active client ID
  const res = await fetch('/api/v1/user/active_client', { cache: 'no-store' });
  let activeId: string | null = null;
  if (res.ok) {
    const data = await res.json();
    activeId = data?.activeClientId || null;
  }

  // No active client assigned but clients exist
  if (!activeId) {
    return { id: null, name: '', hasClients: true };
  }

  // Fetch full client details for display
  const clientRes = await fetch(`/api/v1/clients/${activeId}`, {
    cache: 'no-store',
  });
  if (!clientRes.ok) {
    return { id: activeId, name: '', hasClients: true };
  }

  const client = await clientRes.json();
  return { id: client._id, name: client.name, hasClients: true };
};

// Updates the user's active client
export const setActiveClient = async (id: string | null, name: string = '') => {
  if (isMock) {
    if (id === null) {
      return mockApi.writeActiveClientToStorage('', '');
    }
    return mockApi.writeActiveClientToStorage(id, name);
  }

  // Clears active client
  if (!id) {
    await fetch('/api/v1/user/active_client', { method: 'DELETE' });
  } else {
    // Sets active client
    await fetch('/api/v1/user/active_client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: id }),
    });
  }
};

// Fetches tasks for a specific client
export const getTasksByClient = async (clientId: string) => {
  const allTasks = await getTasks();
  return allTasks.filter((t) => t.clientId === clientId);
};

// Gets full task catalog
export const getTaskCatalog = () => {
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK === '1') {
    return mockApi.getTaskCatalogFE();
  }

  return mockApi.getTaskCatalogFE;
};

// Gets all unique categories for a client
export const getCategoriesForClient = async (clientId: string) => {
  const tasks = await getTasksByClient(clientId);

  const clientCats = Array.from(
    new Set(tasks.map((t) => t.category).filter(Boolean))
  );

  const catalogCats = mockApi.getTaskCatalogFE().map((c) => c.category);

  return Array.from(new Set([...catalogCats, ...clientCats]));
};

type MedicalNotes = {
  diagnosedDisabilities?: string;
  currentMedication?: string;
  allergies?: string;
  recentMedicalHistory?: string;
  primaryHealthContact?: string;
};

// Export Client type for convenience
export type Client = {
  _id: string;
  name: string;
  dob: string;
  gender?: string;
  accessCode?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  email?: string;
  emergencyContact?: string;
  primaryCaregiver?: string;
  address?: string;
  medicalNotes?: MedicalNotes;
};
