"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { GrowthAllocationCard } from "@/modules/growth-brain/components/GrowthAllocationCard";
import { GrowthAlertList } from "@/modules/growth-brain/components/GrowthAlertList";
import { GrowthApprovalQueue } from "@/modules/growth-brain/components/GrowthApprovalQueue";
import { GrowthBrainSummaryBar } from "@/modules/growth-brain/components/GrowthBrainSummaryBar";
import { GrowthOpportunityCard } from "@/modules/growth-brain/components/GrowthOpportunityCard";
import { GrowthPatternCard } from "@/modules/growth-brain/components/GrowthPatternCard";
import { GrowthRecommendationCard } from "@/modules/growth-brain/components/GrowthRecommendationCard";
import type { GrowthAutonomyLevel } from "@/modules/growth-brain/growth-brain.types";
import {
  explainTopOpportunity,
  runGrowthBrainSnapshot,
  setGrowthAutonomy,
  updateApprovalItem,
} from "@/modules/growth-brain/growth-brain.service";

type Props = {
  adminBase: string;
  marketingHubHref: string;
};

export function GrowthBrainDashboardClient({ adminBase, marketingHubHref }: Props) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((x) => x + 1), []);

  const snapshot = useMemo(() => runGrowthBrainSnapshot(), [tick]);
  const explain = useMemo(() => explainTopOpportunity(snapshot), [snapshot]);

  const safeActions = snapshot.actions.filter((a) => a.autoExecutable && !a.approvalRequired);
  const approvalActions = snapshot.actions.filter((a) => a.approvalRequired);

  return (
    <div className="space-y-10 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href={`${adminBase}`} className="hover:text-zinc-300">
              ← Admin
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Growth AI Brain</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Decision-support layer: aggregates signals, ranks opportunities, proposes bounded actions,
            and explains every recommendation. No autonomous spend or mass messaging — impactful moves
            stay approval-gated and logged.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={marketingHubHref}
            className="rounded-lg border border-fuchsia-500/40 px-3 py-2 text-fuchsia-100 hover:bg-fuchsia-950/40"
          >
            Marketing Hub
          </Link>
          <Link
            href={`${marketingHubHref}/calendar`}
            className="rounded-lg border border-violet-500/40 px-3 py-2 text-violet-100 hover:bg-violet-950/40"
          >
            Content Calendar
          </Link>
          <Link
            href={`${adminBase}/marketing/ai`}
            className="rounded-lg border border-amber-500/40 px-3 py-2 text-amber-100 hover:bg-amber-950/40"
          >
            Autonomous Marketing
          </Link>
          <Link
            href={`${adminBase}/revenue-predictor`}
            className="rounded-lg border border-emerald-500/40 px-3 py-2 text-emerald-100 hover:bg-emerald-950/40"
          >
            Revenue Predictor
          </Link>
          <Link
            href={`${adminBase}/market-domination`}
            className="rounded-lg border border-orange-500/40 px-3 py-2 text-orange-100 hover:bg-orange-950/40"
          >
            Market domination
          </Link>
          <Link
            href={`${adminBase}/global`}
            className="rounded-lg border border-cyan-500/40 px-3 py-2 text-cyan-100 hover:bg-cyan-950/40"
          >
            Global expansion
          </Link>
          <Link
            href={`${adminBase}/ai-sales-manager`}
            className="rounded-lg border border-sky-500/40 px-3 py-2 text-sky-100 hover:bg-sky-950/40"
          >
            AI Sales Manager
          </Link>
          <Link
            href={`${adminBase}/growth-leads`}
            className="rounded-lg border border-teal-500/40 px-3 py-2 text-teal-100 hover:bg-teal-950/40"
          >
            Lead routing
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5">
        <h2 className="text-sm font-semibold text-zinc-300">Autonomy mode</h2>
        <p className="mt-1 text-xs text-zinc-600">
          ASSIST = suggestions only · SAFE_AUTOPILOT = low-risk automation · APPROVAL_REQUIRED = queue
          gates · OFF = read-only mirror
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              "OFF",
              "ASSIST",
              "SAFE_AUTOPILOT",
              "APPROVAL_REQUIRED",
            ] as GrowthAutonomyLevel[]
          ).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => {
                setGrowthAutonomy(level);
                refresh();
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                snapshot.autonomy === level
                  ? "border-amber-400 bg-amber-500/20 text-amber-50"
                  : "border-white/15 text-zinc-300 hover:bg-white/10"
              }`}
            >
              {level.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </section>

      <GrowthBrainSummaryBar snapshot={snapshot} />

      {explain ? (
        <section className="rounded-2xl border border-sky-500/25 bg-sky-950/15 p-5 text-sm">
          <h2 className="text-sm font-semibold text-sky-100">Explainability — top opportunity</h2>
          <p className="mt-2 font-medium text-white">{explain.headline}</p>
          <p className="mt-2 text-zinc-400">{explain.prioritizationReason}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Signals: {explain.signalsReferenced.join(", ")}
          </p>
          <p className="mt-2 text-xs text-zinc-500">{explain.confidenceExplanation}</p>
          <p className="mt-2 text-xs text-amber-200/90">{explain.approvalExplanation}</p>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold">Opportunity board</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {snapshot.opportunities.slice(0, 9).map((op, i) => (
            <GrowthOpportunityCard key={op.id} op={op} rank={i + 1} />
          ))}
        </div>
      </section>

      {snapshot.allocation ? <GrowthAllocationCard allocation={snapshot.allocation} /> : null}

      <section>
        <h2 className="text-lg font-semibold">Recommended actions</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-xs uppercase tracking-wide text-emerald-500">Lower risk / safe lane</h3>
            <div className="mt-2 space-y-2">
              {safeActions.length === 0 ? (
                <p className="text-sm text-zinc-600">None in current snapshot.</p>
              ) : (
                safeActions.map((a) => <GrowthRecommendationCard key={a.id} action={a} />)
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wide text-amber-500">Approval required</h3>
            <div className="mt-2 space-y-2">
              {approvalActions.length === 0 ? (
                <p className="text-sm text-zinc-600">None flagged.</p>
              ) : (
                approvalActions.map((a) => <GrowthRecommendationCard key={a.id} action={a} />)
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Learned patterns</h2>
          <p className="text-xs text-zinc-500">From logged outcomes — heuristic, reversible.</p>
          <div className="mt-3 space-y-2">
            <p className="text-xs uppercase text-emerald-600">Working</p>
            {snapshot.learnedPatterns.length === 0 ? (
              <p className="text-sm text-zinc-600">No strong patterns yet — log outcomes after actions.</p>
            ) : (
              snapshot.learnedPatterns.map((p) => (
                <GrowthPatternCard key={p.id} pattern={p} tone="strong" />
              ))
            )}
            <p className="mt-4 text-xs uppercase text-rose-600">Weak / stop repeating</p>
            {snapshot.weakPatterns.length === 0 ? (
              <p className="text-sm text-zinc-600">—</p>
            ) : (
              snapshot.weakPatterns.map((p) => (
                <GrowthPatternCard key={p.id} pattern={p} tone="weak" />
              ))
            )}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Growth alerts</h2>
          <div className="mt-3">
            <GrowthAlertList alerts={snapshot.alerts} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Approval queue</h2>
        <div className="mt-4">
          <GrowthApprovalQueue
            items={snapshot.approvalQueue}
            onDecide={(id, status) => {
              updateApprovalItem(id, status);
              refresh();
            }}
          />
        </div>
      </section>

      <p className="text-[11px] text-zinc-600">
        Generated {new Date(snapshot.generatedAtIso).toLocaleString()} · All outputs are explainable;
        financial or broadcast actions require explicit approval in this model.
      </p>
    </div>
  );
}
