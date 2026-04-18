import type { GrowthOpsManualAdSpend } from "@prisma/client";
import Link from "next/link";
import { listGrowthOpsManualSpendRows } from "@/modules/ads/growth-ops-manual-spend.service";
import { GrowthOpsSpendForm } from "./growth-ops-spend-form";

export const dynamic = "force-dynamic";

export default async function GrowthOpsSpendPage() {
  const rows = await listGrowthOpsManualSpendRows(80);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Growth ops</p>
        <h1 className="mt-2 text-2xl font-semibold">Manual ad spend (CPL input)</h1>
        <p className="mt-2 text-sm text-slate-400">
          Rows attribute paid spend to <code className="text-slate-500">utm_campaign</code> over a date range. Totals
          are prorated into the same rolling windows as the growth dashboard Ads Performance section.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/admin/growth" className="text-sm text-emerald-400 hover:text-emerald-300">
            ← Growth
          </Link>
          <Link href="/en/ca/dashboard/growth" className="text-sm text-sky-400 hover:text-sky-300">
            Open dashboard growth →
          </Link>
        </div>

        <GrowthOpsSpendForm />

        <div className="mt-10">
          <h2 className="text-lg font-medium text-slate-200">Recent rows</h2>
          {rows.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No rows yet — add spend to unlock CPL on the dashboard.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {rows.map((r: GrowthOpsManualAdSpend) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 font-mono text-xs text-slate-300"
                >
                  <span className="text-emerald-300">{r.utmCampaign}</span> · {(r.spendCents / 100).toFixed(2)} {r.currency}{" "}
                  · {r.periodStart.toISOString().slice(0, 10)} → {r.periodEnd.toISOString().slice(0, 10)} (end exclusive UTC)
                  {r.note ? <span className="ml-2 text-slate-500">— {r.note}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
