/**
 * Filename: /src/lib/clientApi.ts
 * Author: Qingyue Zhao
 * Date Created: 28/09/2025
 *
 * Notes:
 * - This file contains both Client/Organisation APIs and Task APIs.
 * - Frontend mock mode (NEXT_PUBLIC_ENABLE_MOCK=1):
 *     - Clients: returns hardcoded mock list
 *     - Tasks:   loads from localStorage('tasks') or seeds demo tasks
 * - Real backend mode:
 *     - Clients: call /api/clients and /api/clients/:id
 *     - Tasks:   call /api/tasks (GET/POST)
 */

export type Client = {
  _id: string;
  name: string;
  dob: string;
  dashboardType?: 'full' | 'partial';
};

export type Organisation = {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'revoked';
};

/** Helper: global flag for mock mode */
export const isMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';

/* =========================
 * Clients (mock or backend)
 * ========================= */

/** Fetch all clients (mock or backend) */
export async function getClientsFE(): Promise<Client[]> {
  if (isMock) {
    // Frontend hardcoded data for testing
    return [
      { _id: 'mock1', name: 'Mock Alice', dob: '1943-09-19', dashboardType: 'full' },
      { _id: 'mock2', name: 'Mock Bob', dob: '1950-01-02', dashboardType: 'partial' },
    ];
  }

  // Real backend API
  const res = await fetch('/api/clients', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch clients (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as Client[]) : [];
}

/** Fetch one client by ID (mock or backend) */
export async function getClientByIdFE(id: string): Promise<Client | null> {
  if (isMock) {
    const mockData: Client[] = [
      { _id: 'mock1', name: 'Mock Alice', dob: '1943-09-19' },
      { _id: 'mock2', name: 'Mock Bob', dob: '1950-01-02' },
    ];
    return mockData.find((c) => c._id === id) || null;
  }

  // Real backend API
  const res = await fetch(`/api/clients/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as Client;
}

/** Optional: mock organisations for UI demo */
export const MOCK_ORGS: Organisation[] = [
  { id: 'org1', name: 'Sunrise Care', status: 'active' },
  { id: 'org2', name: 'North Clinic', status: 'pending' },
  { id: 'org3', name: 'Old Town Care', status: 'revoked' },
];

/* ================
 * Tasks API (FE)
 * ================ */

export type Task = {
  id: string;
  title: string;
  frequency: string;
  lastDone: string;
  nextDue: string;
  status: 'Pending' | 'Due' | 'Completed';
  comments: string[];
  files: string[];
};

// Demo seed used ONLY in mock mode (and written to localStorage)
const DEMO_TASKS: Task[] = [
  {
    id: '1',
    title: 'Dental Appointment',
    frequency: 'Monthly',
    lastDone: '2025-09-15',
    nextDue: '2025-10-01',
    status: 'Pending',
    comments: [
      'Carer note: Arrived on time, patient was calm.',
      'Reminder: Bring Medicare card next visit.',
    ],
    files: ['dental_referral.pdf', 'visit_photo_20250915.jpg'],
  },
  {
    id: '2',
    title: 'Replace Toothbrush Head',
    frequency: 'Every 3 months',
    lastDone: '2025-07-13',
    nextDue: '2025-10-13',
    status: 'Pending',
    comments: [
      'Carer note: Current head slightly worn.',
      'Suggested brand: OralCare Soft-Head (blue).',
    ],
    files: ['toothbrush_receipt.png', 'instruction_sheet.pdf'],
  },
  {
    id: '3',
    title: 'Submit Report',
    frequency: 'Weekly',
    lastDone: '2025-09-18',
    nextDue: '2025-09-25',
    status: 'Due',
    comments: [],
    files: [],
  },
];

const TASKS_LS_KEY = 'tasks';

/** Fetch all tasks (mock or backend) */
export async function getTasksFE(): Promise<Task[]> {
  if (isMock) {
    // Try localStorage first; fallback to demo seed so UI "just shows"
    try {
      const raw = localStorage.getItem(TASKS_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as Task[];
      }
    } catch {
      // ignore parse errors
    }
    try {
      localStorage.setItem(TASKS_LS_KEY, JSON.stringify(DEMO_TASKS));
    } catch {
      // ignore write errors
    }
    return DEMO_TASKS;
  }

  // Real backend (Next.js API route → your DB/service)
  const res = await fetch('/api/tasks', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch tasks (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as Task[]) : [];
}

/** Save all tasks (mock -> localStorage; real -> POST to backend) */
export async function saveTasksFE(tasks: Task[]): Promise<void> {
  if (isMock) {
    try {
      localStorage.setItem(TASKS_LS_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
    return;
  }

  // Real backend: overwrite all
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tasks),
  });
  if (!res.ok) throw new Error(`Failed to save tasks (${res.status})`);
}
