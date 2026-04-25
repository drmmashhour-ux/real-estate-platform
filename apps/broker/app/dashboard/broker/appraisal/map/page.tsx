import { Suspense } from "react";
import { AppraisalMapClient } from "./AppraisalMapClient";

export default function BrokerAppraisalMapPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-white/70">
          <p className="text-sm">Loading map tools…</p>
        </div>
      }
    >
      <AppraisalMapClient />
    </Suspense>
  );
}
