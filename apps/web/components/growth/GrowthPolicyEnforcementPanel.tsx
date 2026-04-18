"use client";

import * as React from "react";
import type { GrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.types";
import { buildGrowthPolicyEnforcementNotes } from "@/modules/growth/growth-policy-enforcement-explainer.service";
import { getEnforcementForTarget } from "@/modules/growth/growth-policy-enforcement-query.service";

const TARGETS = [
  "autopilot_advisory_conversion",
  "autopilot_safe_execution",
  "learning_adjustments",
  "content_assist_generation",
  "messaging_assist_generation",
  "fusion_autopilot_bridge",
  "fusion_content_bridge",
  "fusion_influence_bridge",
  "simulation_recommendation_promotion",
  "strategy_recommendation_promotion",
  "panel_render_hint",
] as const;

export function GrowthPolicyEnforcementPanel() {
  const [snapshot, setSnapshot] = React.useState<GrowthPolicyEnforcementSnapshot | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/policy-enforcement", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { error?: string; snapshot?: GrowthPolicyEnforcementSnapshot | null };
        if (!r.ok) throw new Error(j.error ?? "Policy enforcement unavailable");
        return j.snapshot ?? null;
      })
      .then((s) => {
        if (!cancelled) {
          setSnapshot(s);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setErr(e.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading policy enforcement…</p>;
  }
  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!snapshot) {
    return null;
  }

  const notes = buildGrowthPolicyEnforcementNotes(snapshot).slice(0, 5);

  return (
    <section
      className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-4"
      aria-label="Growth policy enforcement"
    >
      <h3 className="text-sm font-semibold text-amber-100">🚦 Policy Enforcement</h3>
      <p className="mt-1 text-[11px] text-zinc-500">
        Advisory and orchestration gating only — not payments, bookings, ads core, or CRO core.
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-rose-800/50 bg-rose-950/30 px-2 py-0.5 text-rose-100">
          Blocked: {snapshot.blockedTargets.length}
        </span>
        <span className="rounded-full border border-sky-800/45 bg-sky-950/25 px-2 py-0.5 text-sky-100">
          Frozen: {snapshot.frozenTargets.length}
        </span>
        <span className="rounded-full border border-amber-700/45 bg-amber-950/30 px-2 py-0.5 text-amber-100">
          Approval required: {snapshot.approvalRequiredTargets.length}
        </span>
      </div>

      <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-zinc-800/80 bg-black/20">
        <table className="w-full text-left text-[11px] text-zinc-300">
          <thead className="sticky top-0 bg-zinc-900/95 text-zinc-500">
            <tr>
              <th className="px-2 py-1.5 font-medium">Target</th>
              <th className="px-2 py-1.5 font-medium">Mode</th>
            </tr>
          </thead>
          <tbody>
            {TARGETS.map((t) => {
              const d = getEnforcementForTarget(t, snapshot);
              return (
                <tr key={t} className="border-t border-zinc-800/60">
                  <td className="px-2 py-1 align-top font-mono text-[10px] text-zinc-400">{t}</td>
                  <td className="px-2 py-1 align-top">
                    <span className="text-zinc-200">{d.mode}</span>
                    <p className="mt-0.5 text-zinc-500">{d.rationale}</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {notes.length > 0 ? (
        <div className="mt-3 border-t border-zinc-800/80 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Notes</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-zinc-400">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {snapshot.notes.length > 0 ? (
        <div className="mt-2 text-[10px] text-zinc-600">
          {snapshot.notes.slice(0, 3).map((n) => (
            <p key={n}>{n}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
