/**
 * Filename: /src/lib/mockApi.ts
 * Author: Qingyue Zhao
 * Date Created: 28/09/2025
 *
 * Notes:
 * - This file contains both Client/Organisation APIs and Task APIs.
 * - Frontend mock mode (NEXT_PUBLIC_ENABLE_MOCK=1):
 *     - Clients: returns hardcoded mock list (with optional fields present)
 *     - Tasks:   loads from localStorage('tasks') or seeds demo tasks
 *     - Role:    persisted in sessionStorage/localStorage after mock sign-in
 * - Real backend mode:
 *     - Clients: call /api/clients and /api/clients/:id
 *     - Tasks:   call /api/tasks (GET/POST)
 *     - Role:    read from localStorage if present, default 'family'
 */

/* =========================
 * Flags & Shared Constants
 * ========================= */

export const isMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';

export const FULL_DASH_ID = 'mock1'; // Demo: full dashboard client
export const PARTIAL_DASH_ID = 'mock2'; // Demo: partial dashboard client

export const LS_ACTIVE_CLIENT_ID = 'activeClientId';
export const LS_CURRENT_CLIENT_NAME = 'currentClientName';

/* =================
 * Viewer Role (FE)
 * ================= */

export type ViewerRole = 'family' | 'carer' | 'management';
export const LS_ACTIVE_ROLE = 'activeRole'; // long-lived
export const SS_MOCK_ROLE = 'mockRole'; // session-scoped for mock

/**
 * Persist viewer role (call this right after mock sign-in).
 * Keeps a long-lived copy in localStorage and a session copy.
 */
export function setViewerRoleFE(role: ViewerRole): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_ACTIVE_ROLE, role);
  try {
    sessionStorage.setItem(SS_MOCK_ROLE, role);
  } catch {
    // ignore storage limitations
  }
}

/**
 * Read viewer role with sensible priority:
 * - Mock: sessionStorage.mockRole → localStorage.activeRole → 'family'
 * - Real: localStorage.activeRole → 'family'
 */
export function getViewerRoleFE(): ViewerRole {
  if (typeof window === 'undefined') return 'family';

  if (isMock) {
    const s = (sessionStorage.getItem(SS_MOCK_ROLE) || '').toLowerCase();
    if (s === 'family' || s === 'carer' || s === 'management')
      return s as ViewerRole;
  }

  const l = (localStorage.getItem(LS_ACTIVE_ROLE) || '').toLowerCase();
  if (l === 'family' || l === 'carer' || l === 'management')
    return l as ViewerRole;

  return 'family';
}

/** Optional helper: clear role (e.g., on sign-out) */
export function clearViewerRoleFE(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LS_ACTIVE_ROLE);
  try {
    sessionStorage.removeItem(SS_MOCK_ROLE);
  } catch {}
}

/* ============================
 * Clients & Organisations API
 * ============================ */

export type Client = {
  _id: string;
  name: string;
  dob: string;
  dashboardType?: 'full' | 'partial';

  /** Optional fields for UI (safe to read in mock/back-end) */
  accessCode?: string;
  notes?: string[];
  avatarUrl?: string;
};

export type Organisation = {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'revoked';
};

/** Fallback name map (when currentClientName not set) */
export const NAME_BY_ID: Record<string, string> = {
  [FULL_DASH_ID]: 'Mock Alice',
  [PARTIAL_DASH_ID]: 'Mock Bob',
};

/** Read active client (id, name) from localStorage with safe fallback */
export function readActiveClientFromStorage(): {
  id: string | null;
  name: string;
} {
  if (typeof window === 'undefined') return { id: null, name: '' };
  const id = localStorage.getItem(LS_ACTIVE_CLIENT_ID);
  let name = localStorage.getItem(LS_CURRENT_CLIENT_NAME) || '';
  if (!name && id) name = NAME_BY_ID[id] || '';
  return { id, name };
}

/** Centralize writing active client to storage */
export function writeActiveClientToStorage(id: string, name?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_ACTIVE_CLIENT_ID, id);
  if (name) localStorage.setItem(LS_CURRENT_CLIENT_NAME, name);
}

/** Fetch all clients (mock or backend) */
export async function getClientsFE(): Promise<Client[]> {
  if (isMock) {
    // Hardcoded mock list with optional fields present
    return [
      {
        _id: 'mock1',
        name: 'Mock Alice',
        dob: '1943-09-19',
        dashboardType: 'full',
        accessCode: '',
        notes: [],
        avatarUrl: '',
      },
      {
        _id: 'mock2',
        name: 'Mock Bob',
        dob: '1950-01-02',
        dashboardType: 'partial',
        accessCode: '',
        notes: [],
        avatarUrl: '',
      },
    ];
  }

  // Real backend
  const res = await fetch('/api/clients', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch clients (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as Client[]) : [];
}

/** Fetch one client by ID (mock or backend) */
export async function getClientByIdFE(id: string): Promise<Client | null> {
  if (isMock) {
    const mockData: Client[] = [
      {
        _id: 'mock1',
        name: 'Mock Alice',
        dob: '1943-09-19',
        dashboardType: 'full',
        accessCode: '',
        notes: [],
        avatarUrl: '',
      },
      {
        _id: 'mock2',
        name: 'Mock Bob',
        dob: '1950-01-02',
        dashboardType: 'partial',
        accessCode: '',
        notes: [],
        avatarUrl: '',
      },
    ];
    return mockData.find((c) => c._id === id) || null;
  }

  // Real backend
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

/* ==========
 * Tasks API
 * ========== */

export type Task = {
  id: string;
  title: string;
  frequency: string;
  lastDone: string; // YYYY-MM-DD
  nextDue: string; // YYYY-MM-DD
  status: 'Pending' | 'Due' | 'Completed';
  comments: string[];
  files: string[];
};

const TASKS_LS_KEY = 'tasks';

// Demo seed (mock mode only)
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

/** Fetch all tasks (mock or backend) */
export async function getTasksFE(): Promise<Task[]> {
  if (isMock) {
    // Try localStorage; fallback to demo seed so UI is populated
    try {
      const raw = localStorage.getItem(TASKS_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as Task[];
      }
    } catch {
      // ignore JSON errors
    }
    try {
      localStorage.setItem(TASKS_LS_KEY, JSON.stringify(DEMO_TASKS));
    } catch {
      // ignore write errors
    }
    return DEMO_TASKS;
  }

  // Real backend
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
      // ignore storage issues
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

//mock data for manage client task for management

export type TaskCatalogItem = { label: string; slug: string };
export type TaskCatalog = { category: string; tasks: TaskCatalogItem[] }[];

/**
 * Frontend-mock catalog for category -> task names.
 * Hardcoded as requested: Appointments / Hygiene / Clothing
 */
export function getTaskCatalogFE(): TaskCatalog {
  return [
    {
      category: 'Appointments',
      tasks: [
        { label: 'Dental Appointment', slug: 'dental-appointment' },
        { label: 'GP Checkup', slug: 'gp-checkup' },
        { label: 'Eye Test', slug: 'eye-test' },
      ],
    },
    {
      category: 'Hygiene',
      tasks: [
        { label: 'Replace Toothbrush Head', slug: 'replace-toothbrush-head' },
        { label: 'Shower Assistance', slug: 'shower-assistance' },
        { label: 'Nail Trimming', slug: 'nail-trimming' },
      ],
    },
    {
      category: 'Clothing',
      tasks: [
        { label: 'Laundry Pickup', slug: 'laundry-pickup' },
        { label: 'Seasonal Wardrobe Update', slug: 'seasonal-wardrobe-update' },
        { label: 'Mend Clothing', slug: 'mend-clothing' },
      ],
    },
  ];
}

/* =================
 * Staff API (FE)
 * ================= */

export type Staff = {
  _id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: 'management' | 'carer';
  status?: 'active' | 'inactive';
};

export const MOCK_STAFF: Staff[] = [
  {
    _id: 's001',
    name: 'Alice Brown',
    email: 'alice.brown@example.com',
    role: 'carer',
    status: 'active',
    avatarUrl: '/avatars/alice.png',
  },
  {
    _id: 's002',
    name: 'Brian Chen',
    email: 'brian.chen@example.com',
    role: 'carer',
    status: 'inactive',
    avatarUrl: '/avatars/brian.png',
  },
  {
    _id: 's003',
    name: 'Chloe Davis',
    email: 'chloe.davis@example.com',
    role: 'management',
    status: 'active',
    avatarUrl: '/avatars/chloe.png',
  },
  {
    _id: 's004',
    name: 'Diego Evans',
    email: 'diego.evans@example.com',
    role: 'carer',
    status: 'active',
  },
  {
    _id: 's005',
    name: 'Emma Fox',
    email: 'emma.fox@example.com',
    role: 'carer',
    status: 'active',
  },
];

export async function getStaffFE(): Promise<Staff[]> {
  if (isMock) {
    return MOCK_STAFF;
  }
  const res = await fetch('/api/management/staff', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch staff (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as Staff[]) : [];
}

// ========== Frequency options for Manage Care Item (FE mock only) ==========

/**
 * Canonical time unit used by the frequency selector.
 * If you already have a Unit type in your app, delete this duplicate.
 */
export type Unit = 'day' | 'week' | 'month' | 'year';

/**
 * One selectable frequency option in the dropdown.
 * - id: stable string for <option value>, avoids number+unit tuples in DOM values
 * - label: human-friendly text (what the user sees)
 * - count + unit: the actual semantic value used by your logic
 */
export type FrequencyOption = {
  id: string;
  label: string;
  count: number;
  unit: Unit;
};

/**
 * Fallback options used when a task slug has no specific template.
 * Keep this generic so the UI always has something to render.
 */
const DEFAULT_FREQUENCY_OPTIONS: FrequencyOption[] = [
  { id: '1w', label: 'Every week', count: 1, unit: 'week' },
  { id: '2w', label: 'Every 2 weeks', count: 2, unit: 'week' },
  { id: '1m', label: 'Every month', count: 1, unit: 'month' },
  { id: '3m', label: 'Every 3 months', count: 3, unit: 'month' },
  { id: '6m', label: 'Every 6 months', count: 6, unit: 'month' },
  { id: '1y', label: 'Every year', count: 1, unit: 'year' },
];

/**
 * Lightweight per-task templates for FE mock.
 */
const TASK_TEMPLATES: Record<
  string,
  {
    frequencyOptions: FrequencyOption[];
  }
> = {
  'dental-appointment': {
    frequencyOptions: [
      { id: '1m', label: 'Every month', count: 1, unit: 'month' },
      { id: '3m', label: 'Every 3 months', count: 3, unit: 'month' },
      { id: '6m', label: 'Every 6 months', count: 6, unit: 'month' },
      { id: '1y', label: 'Every year', count: 1, unit: 'year' },
    ],
  },
  'gp-checkup': {
    frequencyOptions: [
      { id: '1m', label: 'Every month', count: 1, unit: 'month' },
      { id: '2m', label: 'Every 2 months', count: 2, unit: 'month' },
      { id: '3m', label: 'Every 3 months', count: 3, unit: 'month' },
      { id: '6m', label: 'Every 6 months', count: 6, unit: 'month' },
    ],
  },
  'eye-test': {
    frequencyOptions: [
      { id: '6m', label: 'Every 6 months', count: 6, unit: 'month' },
      { id: '1y', label: 'Every year', count: 1, unit: 'year' },
      { id: '2y', label: 'Every 2 years', count: 2, unit: 'year' },
    ],
  },
  'replace-toothbrush-head': {
    frequencyOptions: [
      { id: '1m', label: 'Every month', count: 1, unit: 'month' },
      { id: '3m', label: 'Every 3 months', count: 3, unit: 'month' },
      { id: '6m', label: 'Every 6 months', count: 6, unit: 'month' },
    ],
  },
  'shower-assistance': {
    frequencyOptions: [
      { id: '1d', label: 'Every day', count: 1, unit: 'day' },
      { id: '2d', label: 'Every 2 days', count: 2, unit: 'day' },
      { id: '1w', label: 'Every week', count: 1, unit: 'week' },
    ],
  },
  'nail-trimming': {
    frequencyOptions: [
      { id: '2w', label: 'Every 2 weeks', count: 2, unit: 'week' },
      { id: '1m', label: 'Every month', count: 1, unit: 'month' },
      { id: '6w', label: 'Every 6 weeks', count: 6, unit: 'week' },
    ],
  },
  'laundry-pickup': {
    frequencyOptions: [
      { id: '1w', label: 'Every week', count: 1, unit: 'week' },
      { id: '2w', label: 'Every 2 weeks', count: 2, unit: 'week' },
      { id: '1m', label: 'Every month', count: 1, unit: 'month' },
    ],
  },
  'seasonal-wardrobe-update': {
    frequencyOptions: [
      { id: '3m', label: 'Every 3 months', count: 3, unit: 'month' },
      { id: '6m', label: 'Every 6 months', count: 6, unit: 'month' },
      { id: '1y', label: 'Every year', count: 1, unit: 'year' },
    ],
  },
  'mend-clothing': {
    frequencyOptions: [
      { id: '2w', label: 'Every 2 weeks', count: 2, unit: 'week' },
      { id: '1m', label: 'Every month', count: 1, unit: 'month' },
      { id: '3m', label: 'Every 3 months', count: 3, unit: 'month' },
    ],
  },
};

/**
 * Public helper for UI: returns frequency dropdown options for a given task slug.
 * - If the slug is unknown or missing, DEFAULT_FREQUENCY_OPTIONS are returned.
 * - This is FE-only and intentionally does not touch backend APIs.
 */
export function getFrequencyOptionsByTaskSlugFE(
  slug?: string
): FrequencyOption[] {
  if (!slug) return DEFAULT_FREQUENCY_OPTIONS;
  return TASK_TEMPLATES[slug]?.frequencyOptions ?? DEFAULT_FREQUENCY_OPTIONS;
}
