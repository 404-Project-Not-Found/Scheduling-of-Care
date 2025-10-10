/**
 * File path: /app/management_dashboard/manage_care_item/edit//EditCareItem.tsx
 * Author: Zahra Rizqita
 * Created on: 10/10/2025
 * 
 * Wrapper for search Params
 */

'use client';

import { Suspense } from 'react';
import EditCareItem from './EditCareItem';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <EditCareItem/>
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';