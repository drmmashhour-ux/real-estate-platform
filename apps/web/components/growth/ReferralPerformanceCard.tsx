"use client";

import Link from "next/link";

export function ReferralPerformanceCard({
  count,
  basePath,
  referralsHubPath,
}: {
  count: number;
  basePath: string;
  referralsHubPath: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">Referrals</h3>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-100">{count}</p>
      <p className="text-xs text-zinc-500">Codes created under your account (real DB count).</p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <Link href={`${basePath}/reports`} className="text-emerald-400 hover:underline">
          Growth reports
        </Link>
        <Link href={referralsHubPath} className="text-zinc-400 hover:text-white">
          Referral hub
        </Link>
      </div>
    </div>
  );
}
