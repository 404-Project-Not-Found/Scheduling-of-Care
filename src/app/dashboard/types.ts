// src/app/dashboard/types.ts
export interface Task {
  id: string;
  title: string;
  frequency: string;
  lastDone: string;
  nextDue: string;
  status: string;
  comments: string[];       
  files?: string[];         
}
