//IMPORTANT: no longer use this page

import { Suspense } from 'react';
import AssignCarerPage from './ManageCarer';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AssignCarerPage />
    </Suspense>
  );
}
