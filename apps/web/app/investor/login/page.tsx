import { Suspense } from "react";
import { InvestorLoginClient } from "./InvestorLoginClient";

export default function InvestorLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050505] text-slate-500">Loading…</div>
      }
    >
      <InvestorLoginClient />
    </Suspense>
  );
}
