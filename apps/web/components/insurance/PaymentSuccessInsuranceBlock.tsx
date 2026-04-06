"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { InsuranceLeadForm } from "@/components/InsuranceLeadForm";

function Inner() {
  const sp = useSearchParams();
  const bookingId = sp.get("bookingId") ?? "";

  return (
    <div className="mt-10 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/80 p-5 text-left">
      <p className="text-sm font-semibold text-amber-200/95">Protect your investment / trip</p>
      <p className="mt-1 text-xs text-slate-400">
        Optional insurance quote from a licensed partner. Submit only if you want someone to contact you.
      </p>
      <div className="mt-4">
        <InsuranceLeadForm
          variant="B"
          leadType="travel"
          source="checkout"
          bookingId={bookingId || undefined}
          className="!border-0 !bg-transparent !p-0 !shadow-none"
        />
      </div>
    </div>
  );
}

export function PaymentSuccessInsuranceBlock() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
