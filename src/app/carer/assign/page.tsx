import { Suspense } from "react";
import AssignCarerPage from "./AssignCarer";


export default function Page() {
  return (
    <Suspense fallback={null}>
      <AssignCarerPage />
    </Suspense>
  );
}
