import { Suspense } from "react";
import EditTaskClient from "./EditTaskClient";

// export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EditTaskClient />
    </Suspense>
  );
}
