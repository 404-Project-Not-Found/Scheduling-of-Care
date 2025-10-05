/**
 * File path: /lib/data.ts
 * Author: Denise Alexander
 * Date Created: 04/10/2025
 */

import * as mockApi from './mock/mockApi';
import { getSession } from 'next-auth/react';

const useMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';

export const getClients = async () => {
  if (useMock) {
    return mockApi.getClientsFE();
  }
  const res = await fetch('/api/v1/clients', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch clients (${res.status})`);
  }
  return (await res.json()) as mockApi.Client[];
};

export const getClientById = async (id: string) => {
  if (useMock) {
    return mockApi.getClientByIdFE(id);
  }
  const res = await fetch(`/api/v1/clients/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as mockApi.Client;
};

export const getTasks = async () => {
  if (useMock) {
    return mockApi.getTasksFE();
  }
  const res = await fetch('api/v1/tasks', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks (${res.status})`);
  }
  return (await res.json()) as mockApi.Task[];
};

export const saveTasks = async (tasks: mockApi.Task[]) => {
  if (useMock) {
    return mockApi.saveTasksFE(tasks);
  }
  const res = await fetch('/api/v1/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tasks),
  });
  if (!res.ok) {
    throw new Error(`Failed to save tasks ${res.status}`);
  }
};

export const getViewerRole = async (): Promise<
  'carer' | 'family' | 'management'
> => {
  if (useMock) {
    return mockApi.getViewerRoleFE();
  }

  const session = await getSession();
  if (!session?.user?.role) {
    return 'carer'; // fallback
  }
  return session.user.role as 'carer' | 'family' | 'management';
};

export const readActiveClientFromStorage = mockApi.readActiveClientFromStorage;
export const writeActiveClientToStorage = mockApi.writeActiveClientToStorage;

export type Client = mockApi.Client;
