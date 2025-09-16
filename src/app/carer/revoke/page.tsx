import { Suspense } from "react";
import RevokeCarerPage from "./RevokeCarer";


export default function Page() {
  return (
    <Suspense fallback={null}>
      <RevokeCarerPage />
    </Suspense>
  );
}
