import Link from "next/link";
import type { OwnerDashboardPayload } from "@/modules/owner-dashboard/owner-dashboard.types";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";
import { OwnerAlertsStrip } from "./OwnerAlertsStrip";
import { OwnerBlockersPanel } from "./OwnerBlockersPanel";
import { OwnerBrokerPerformanceCard } from "./OwnerBrokerPerformanceCard";
import { OwnerComplianceCard } from "./OwnerComplianceCard";
import { OwnerKPIBar } from "./OwnerKPIBar";
import { OwnerPipelineCard } from "./OwnerPipelineCard";
import { OwnerPriorityQueue } from "./OwnerPriorityQueue";
import { OwnerRevenueCard } from "./OwnerRevenueCard";
import { OwnerTrendChart } from "./OwnerTrendChart";

const WINDOWS: KpiWindow[] = ["today", "7d", "30d", "quarter", "year"];

export function OwnerDashboard({
  basePath,
  window,
  data,
}: {
  basePath: string;
  window: KpiWindow;
  data: OwnerDashboardPayload;
}) {
  const m = data.metrics;

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">Executive</p>
          <h1 className="font-serif text-3xl text-amber-50">Tableau de bord propriétaire</h1>
          <p className="mt-1 text-xs text-zinc-500">
            {m.scopeLabel} · {m.range.startIso.slice(0, 10)} → {m.range.endIso.slice(0, 10)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {WINDOWS.map((w) => (
            <Link
              key={w}
              href={`${basePath}/brokerage/dashboard?window=${w}`}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                w === window
                  ? "border-amber-500/70 bg-amber-500/10 text-amber-100"
                  : "border-amber-900/40 bg-black/40 text-zinc-500 hover:border-amber-800/50"
              }`}
            >
              {w}
            </Link>
          ))}
          <Link
            href={`${basePath}/brokerage/strategy`}
            className="rounded-lg border border-amber-800/50 bg-black/50 px-3 py-1.5 text-xs text-amber-200/90 hover:bg-amber-500/10"
          >
            Stratégie →
          </Link>
        </div>
      </header>

      <OwnerAlertsStrip alerts={data.alerts} />

      <OwnerKPIBar metrics={m} />

      <div className="grid gap-6 lg:grid-cols-2">
        <OwnerRevenueCard metrics={m} />
        <OwnerPipelineCard metrics={m} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OwnerComplianceCard metrics={m} />
        <OwnerBlockersPanel metrics={m} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OwnerBrokerPerformanceCard metrics={m} />
        <OwnerPriorityQueue priorities={data.priorities} />
      </div>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Tendance — closings</h2>
        <div className="mt-2 rounded-xl border border-amber-900/35 bg-black/50 p-4">
          <OwnerTrendChart metric="closed_deals" window={window} />
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-zinc-600">{data.estimateNote}</p>
      <p className="text-[11px] text-zinc-600">{m.disclaimer}</p>
    </div>
  );
}
