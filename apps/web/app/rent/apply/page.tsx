import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { MvpNav } from "@/components/investment/MvpNav";
import { PLATFORM_CARREFOUR_NAME } from "@/lib/brand/platform";
import { RentApplyClient } from "./rent-apply-client";

export const metadata: Metadata = {
  title: `Apply to rent | ${PLATFORM_CARREFOUR_NAME}`,
};

export default function RentApplyPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <MvpNav variant="live" />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-premium-gold">Rent Hub</p>
        <h1 className="mt-3 text-2xl font-bold">Rental application</h1>
        <p className="mt-2 text-sm text-white/60">
          Submit your application and optional document notes. The landlord reviews and responds in the dashboard.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-white/50">Loading…</p>}>
            <RentApplyClient />
          </Suspense>
        </div>
        <p className="mt-10 text-center text-sm text-white/50">
          <Link href="/rent" className="text-premium-gold hover:underline">
            ← Back to long-term search
          </Link>
        </p>
      </main>
    </div>
  );
}
