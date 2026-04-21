"use client";

import { useState } from "react";
import { MockBadge, MockButton, MockCard } from "@/components/lecipm-dashboard-mock/mock-ui";

const DEALS = [
  {
    id: "d1",
    title: "Duplex · Verdun",
    stage: "Negotiation",
    score: 79,
    prob: 58,
    risk: "Low",
    next: "Send updated APS summary to buyer counsel",
    timeline: "Offer accepted · due diligence Day 4 / 10",
  },
  {
    id: "d2",
    title: "Condo · Plateau",
    stage: "Inspection",
    score: 71,
    prob: 44,
    risk: "Medium",
    next: "Schedule inspection recap + price adjustment envelope",
    timeline: "Inspection slot · Feb 14",
  },
  {
    id: "d3",
    title: "Triplex · Rosemont",
    stage: "Qualification",
    score: 66,
    prob: 32,
    risk: "Medium",
    next: "Collect rental ledger + CMHC rent roll",
    timeline: "Financing pre-approval pending",
  },
] as const;

export function DealEnginePage() {
  const [selected, setSelected] = useState<(typeof DEALS)[number]>(DEALS[0]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
      <MockCard className="w-full shrink-0 lg:w-[340px]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Pipeline</p>
        <h1 className="mt-2 text-xl font-bold text-white">Deals</h1>
        <ul className="mt-5 space-y-2">
          {DEALS.map((d) => {
            const active = selected.id === d.id;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setSelected(d)}
                  className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition-all duration-200 ${
                    active
                      ? "border-ds-gold bg-ds-gold/10 text-white shadow-[0_0_24px_rgba(212,175,55,0.18)]"
                      : "border-ds-border bg-black/30 text-ds-text-secondary hover:border-ds-gold/35 hover:text-white"
                  }`}
                >
                  <span className="font-semibold">{d.title}</span>
                  <span className="mt-1 block text-xs opacity-90">{d.stage}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </MockCard>

      <MockCard className="min-h-[420px] flex-1 transition-all duration-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white">{selected.title}</h2>
              <MockBadge tone="gold">{selected.stage}</MockBadge>
              <span className="rounded-full border border-ds-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ds-text-secondary">
                Risk · {selected.risk}
              </span>
            </div>
          </div>
          <MockButton>Open deal room</MockButton>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Metric label="dealScore" value={String(selected.score)} accent />
          <Metric label="probability" value={`${selected.prob}%`} />
        </div>

        <div className="mt-8 rounded-xl border border-ds-border bg-black/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">timeline</p>
          <p className="mt-2 text-sm font-medium text-white">{selected.timeline}</p>
          <DealTimelineSteps stage={selected.stage} />
        </div>

        <div className="mt-8 border-t border-ds-border pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">nextBestAction</p>
          <p className="mt-3 text-base font-medium leading-relaxed text-white">{selected.next}</p>
          <MockButton className="mt-4">Mark complete</MockButton>
        </div>
      </MockCard>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ds-border bg-black/50 p-4">
      <p className="text-[11px] uppercase tracking-wide text-ds-text-secondary">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-ds-gold" : "text-white"}`}>{value}</p>
    </div>
  );
}

const STAGES = ["Qualification", "Inspection", "Negotiation", "Closing"] as const;

function DealTimelineSteps({ stage }: { stage: string }) {
  const idx = STAGES.findIndex((s) => s === stage);
  const active = idx >= 0 ? idx : 1;
  return (
    <ol className="mt-4 flex flex-wrap gap-2">
      {STAGES.map((s, i) => (
        <li
          key={s}
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
            i <= active
              ? "border-ds-gold/45 bg-ds-gold/10 text-ds-gold shadow-[0_0_16px_rgba(212,175,55,0.12)]"
              : "border-ds-border text-ds-text-secondary"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {s}
        </li>
      ))}
    </ol>
  );
}
