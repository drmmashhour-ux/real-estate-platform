"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "./autonomy-styles";

type DealRow = {
  id: string;
  dealCode: string | null;
  status: string;
  crmStage: string | null;
  updatedAt: Date | string;
};

export function DealIntelligencePanel(props: {
  priority: DealRow[];
  stalled: DealRow[];
  hot: DealRow[];
  riskDistribution: Array<{ status: string; count: number }>;
}) {
  return (
    <section className={`${autonomyGlassCard} p-5`}>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#D4AF37]/15 pb-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Section 05</p>
          <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Deal pipeline intelligence</h2>
          <p className={`mt-1 text-sm ${autonomyMuted}`}>Heuristic cohorts — always verify with broker CRM context.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/admin">
            <Button variant="outline" size="sm" className="!border-[#D4AF37]/35">
              Open admin hub
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <DealColumn title="Priority motion" deals={props.priority} />
        <DealColumn title="Stalled / aging" deals={props.stalled} tone="amber" />
        <DealColumn title="High probability" deals={props.hot} tone="emerald" />
      </div>

      <div className="mt-5 rounded-xl border border-[#D4AF37]/10 bg-black/40 p-4">
        <p className={`text-xs uppercase ${autonomyMuted}`}>Risk distribution (open pipeline)</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {props.riskDistribution.length === 0 ?
            <span className={`text-sm ${autonomyMuted}`}>No distribution available.</span>
          : props.riskDistribution.map((r) => (
              <span
                key={r.status}
                className="rounded-full border border-[#D4AF37]/20 px-3 py-1 text-xs text-[#e8dfd0]"
              >
                {r.status}: {r.count}
              </span>
            ))
          }
        </div>
      </div>
    </section>
  );
}

function DealColumn(props: { title: string; deals: DealRow[]; tone?: "amber" | "emerald" }) {
  const border =
    props.tone === "amber" ? "border-amber-500/30"
    : props.tone === "emerald" ? "border-emerald-500/25"
    : "border-[#D4AF37]/15";
  return (
    <div className={`rounded-xl border ${border} bg-black/35 p-3`}>
      <p className={`text-xs uppercase ${autonomyMuted}`}>{props.title}</p>
      <ul className="mt-2 space-y-2">
        {props.deals.length === 0 ?
          <li className={`text-sm ${autonomyMuted}`}>None surfaced.</li>
        : props.deals.map((d) => (
            <li key={d.id} className="rounded-lg border border-[#D4AF37]/10 px-2 py-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium text-[#f4efe4]">{d.dealCode ?? d.id.slice(0, 8)}</span>
                <span className="text-[11px] text-[#a39e93]">{d.status}</span>
              </div>
              <p className="text-[11px] text-[#a39e93]">{d.crmStage ?? "—"}</p>
            </li>
          ))
        }
      </ul>
    </div>
  );
}
