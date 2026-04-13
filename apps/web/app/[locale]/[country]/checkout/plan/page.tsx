import { Suspense } from "react";
import { CheckoutPlanClient } from "./checkout-plan-client";

export default function CheckoutPlanPage() {
  return (
    <div className="min-h-[70vh] bg-[#0a0a0a] text-slate-50">
      <Suspense
        fallback={
          <div className="flex min-h-[70vh] items-center justify-center px-4 text-sm text-slate-500">
            Loading…
          </div>
        }
      >
        <CheckoutPlanClient />
      </Suspense>
    </div>
  );
}
