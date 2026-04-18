import Link from "next/link";
import type { BrokerGrowthDashboardSnapshot } from "@/modules/broker-growth/broker-growth.types";
import type { GrowthCoachSummary } from "@/modules/broker-growth-coach/growth-coach.types";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";
import { BrokerGoalCard } from "./BrokerGoalCard";
import { DealVelocityCard } from "./DealVelocityCard";
import { FollowupHealthCard } from "./FollowupHealthCard";
import { GrowthKPIBar } from "./GrowthKPIBar";
import { GrowthTrendChart } from "./GrowthTrendChart";
import { LeadConversionCard } from "./LeadConversionCard";
import { ListingPerformanceCard } from "./ListingPerformanceCard";
import { RevenueProgressCard } from "./RevenueProgressCard";

const WINDOWS: KpiWindow[] = ["today", "7d", "30d", "quarter", "year"];

export function BrokerGrowthDashboard({
  basePath,
  window,
  data,
  coaching,
  disclaimer,
}: {
  basePath: string;
  window: KpiWindow;
  data: BrokerGrowthDashboardSnapshot;
  coaching: GrowthCoachSummary | null;
  disclaimer: string;
}) {
  const { kpi, growth, residentialScopeNote } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">LECIPM · résidentiel</p>
          <h1 className="font-serif text-2xl text-amber-50">Croissance personnelle</h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-500">
            Fenêtre: <span className="text-zinc-400">{kpi.window}</span> · {kpi.range.startIso.slice(0, 10)} →{" "}
            {kpi.range.endIso.slice(0, 10)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {WINDOWS.map((w) => (
            <Link
              key={w}
              href={`${basePath}/growth?window=${w}`}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                w === window
                  ? "border-amber-500/70 bg-amber-500/10 text-amber-100"
                  : "border-amber-900/40 bg-black/40 text-zinc-400 hover:border-amber-700/50"
              }`}
            >
              {w}
            </Link>
          ))}
        </div>
      </div>

      <GrowthKPIBar growth={growth} />

      <section className="grid gap-4 lg:grid-cols-3">
        <LeadConversionCard growth={growth} />
        <ListingPerformanceCard growth={growth} />
        <FollowupHealthCard kpi={kpi} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DealVelocityCard growth={growth} />
        <RevenueProgressCard growth={growth} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Tendance (nouvelles demandes)</h2>
        <div className="rounded-xl border border-amber-900/35 bg-black/50 p-4">
          <GrowthTrendChart metric="new_leads" window={window} />
        </div>
      </section>

      <BrokerGoalCard coaching={coaching} />

      <section className="rounded-xl border border-amber-900/25 bg-black/40 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Prochaines actions (interne)</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-300">
          <li>
            <Link className="text-amber-200/90 underline" href={`${basePath}/listings/growth`}>
              Espace croissance des inscriptions
            </Link>
          </li>
          <li>Réviser les brouillons marketing en attente avant toute publication.</li>
        </ul>
      </section>

      <p className="text-[11px] leading-relaxed text-zinc-600">{disclaimer}</p>
      <p className="text-[11px] text-zinc-600">{residentialScopeNote}</p>
      <p className="text-[11px] text-zinc-600">{kpi.disclaimer}</p>
    </div>
  );
}
