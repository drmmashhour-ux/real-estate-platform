"use client";

import Link from "next/link";

export function BrokerGrowthCard({ locale, country }: { locale: string; country: string }) {
  const broker = `/${locale}/${country}/dashboard/broker`;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">Broker growth</h3>
      <p className="mt-2 text-sm text-zinc-400">
        Pipeline counts and stale-lead signals feed automation suggestions — always review before sending outreach.
      </p>
      <Link href={broker} className="mt-3 inline-block text-sm text-emerald-400 hover:underline">
        Broker CRM →
      </Link>
    </div>
  );
}
