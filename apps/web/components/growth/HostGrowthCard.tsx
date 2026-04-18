"use client";

import Link from "next/link";

export function HostGrowthCard({ locale, country }: { locale: string; country: string }) {
  const bnhub = `/${locale}/${country}/dashboard/bnhub/host`;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">BNHub host growth</h3>
      <p className="mt-2 text-sm text-zinc-400">
        Host onboarding, publish rate, and booking funnel are tracked in BNHub. Recruitment copy lives in Marketing
        Studio + growth content API.
      </p>
      <Link href={bnhub} className="mt-3 inline-block text-sm text-emerald-400 hover:underline">
        Host dashboard →
      </Link>
    </div>
  );
}
