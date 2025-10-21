// src/app/dashboard/types.ts
export type Task = {
  id: string;
  label: string;
  frequency: string;
  lastDone: string;
  nextDue: string;
  status: 'Overdue' | 'Pending' | 'Completed';
  comments: string[];
  files: string[];
};
