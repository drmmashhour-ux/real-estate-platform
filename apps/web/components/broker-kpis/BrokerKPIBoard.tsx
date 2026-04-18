import Link from "next/link";
import type { BrokerKpiSnapshot } from "@/modules/broker-kpis/broker-kpis.types";
import { BrokerClosingCard } from "./BrokerClosingCard";
import { BrokerExecutionHealthCard } from "./BrokerExecutionHealthCard";
import { BrokerFollowupHealthCard } from "./BrokerFollowupHealthCard";
import { BrokerKPICard } from "./BrokerKPICard";
import { BrokerPipelineSummary } from "./BrokerPipelineSummary";
import { BrokerTrendChart } from "./BrokerTrendChart";
import { BrokerWorkloadCard } from "./BrokerWorkloadCard";

export function BrokerKPIBoard({
  basePath,
  snapshot,
}: {
  basePath: string;
  snapshot: BrokerKpiSnapshot;
}) {
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">Performance board</p>
          <h2 className="font-serif text-2xl text-amber-50">Broker KPIs</h2>
          <p className="mt-1 max-w-2xl text-xs text-zinc-500">
            Window: <span className="text-zinc-400">{snapshot.window}</span> ·{" "}
            {snapshot.range.startIso.slice(0, 10)} → {snapshot.range.endIso.slice(0, 10)}
          </p>
        </div>
        <Link
          href={`${basePath}/team/workload`}
          className="rounded-lg border border-amber-800/50 bg-black/40 px-4 py-2 text-xs font-medium text-amber-200/90 hover:border-amber-600/60"
        >
          Workload &amp; bottlenecks →
        </Link>
      </div>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Top KPI row</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <BrokerKPICard label="Active deals" value={snapshot.deal.activeDeals} />
          <BrokerKPICard label="New leads" value={snapshot.lead.newLeads} />
          <BrokerKPICard label="Follow-up overdue" value={snapshot.lead.followUpOverdue} />
          <BrokerKPICard label="Doc requests overdue" value={snapshot.coordination.documentRequestsOverdue} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Trend (new leads · 30d)</h3>
        <div className="rounded-xl border border-amber-900/35 bg-black/50 p-4">
          <BrokerTrendChart metric="new_leads" window="30d" />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Pipeline</h3>
        <BrokerPipelineSummary deal={snapshot.deal} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Follow-up health</h3>
        <BrokerFollowupHealthCard lead={snapshot.lead} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Communication</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <BrokerKPICard label="Outbound" value={snapshot.communication.outboundMessages} />
          <BrokerKPICard label="Inbound" value={snapshot.communication.inboundMessages} />
          <BrokerKPICard label="Drafts pending approval" value={snapshot.communication.draftsPendingApproval} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Execution bottlenecks</h3>
        <BrokerExecutionHealthCard execution={snapshot.execution} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Negotiation &amp; closing</h3>
        <BrokerClosingCard
          negotiation={snapshot.negotiation}
          closing={snapshot.closing}
          coordination={snapshot.coordination}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Workload &amp; blockers</h3>
        <BrokerWorkloadCard workload={snapshot.workload} overdue={snapshot.overdue} />
      </section>

      <p className="text-[11px] leading-relaxed text-zinc-600">{snapshot.disclaimer}</p>
    </div>
  );
}
