"use client";

import * as React from "react";
import type { GrowthGovernancePolicySnapshot } from "@/modules/growth/growth-governance-policy.types";
import type { GrowthPolicyDomain } from "@/modules/growth/growth-governance-policy.types";
import { formatPolicyModeLabel } from "@/modules/growth/growth-governance-policy-query.service";

const ORDER: GrowthPolicyDomain[] = [
  "leads",
  "ads",
  "cro",
  "content",
  "messaging",
  "autopilot",
  "learning",
  "fusion",
];

export function GrowthGovernanceConsolePanel() {
  const [snapshot, setSnapshot] = React.useState<GrowthGovernancePolicySnapshot | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/governance-policy", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { error?: string; snapshot?: GrowthGovernancePolicySnapshot };
        if (!r.ok) throw new Error(j.error ?? "Policy unavailable");
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

  if (loading) return <p className="text-sm text-zinc-500">Loading governance policy…</p>;
  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!snapshot) return null;

  const ruleByDomain = new Map(snapshot.rules.map((r) => [r.domain, r]));

  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-950/25 p-4" aria-label="Governance policy console">
      <h3 className="text-sm font-semibold text-slate-100">🛡 Governance Console</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Read-only policy map — visibility only in v1; does not change execution or source systems.
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        {snapshot.frozenDomains.length ? (
          <span className="rounded-full border border-amber-800/60 bg-amber-950/40 px-2 py-0.5 text-amber-100">
            Frozen: {snapshot.frozenDomains.join(", ")}
          </span>
        ) : null}
        {snapshot.blockedDomains.length ? (
          <span className="rounded-full border border-rose-900/50 bg-rose-950/30 px-2 py-0.5 text-rose-100">
            Blocked: {snapshot.blockedDomains.join(", ")}
          </span>
        ) : null}
        {snapshot.reviewRequiredDomains.length ? (
          <span className="rounded-full border border-sky-900/50 bg-sky-950/30 px-2 py-0.5 text-sky-100">
            Review: {snapshot.reviewRequiredDomains.join(", ")}
          </span>
        ) : null}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-left text-xs text-zinc-300">
          <thead>
            <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wide text-zinc-500">
              <th className="py-2 pr-2 font-medium">Domain</th>
              <th className="py-2 pr-2 font-medium">Mode</th>
              <th className="py-2 font-medium">Rationale</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.map((d) => {
              const r = ruleByDomain.get(d);
              if (!r) return null;
              return (
                <tr key={d} className="border-b border-zinc-800/60">
                  <td className="py-2 pr-2 font-medium text-zinc-200">{d}</td>
                  <td className="py-2 pr-2 text-slate-200">{formatPolicyModeLabel(r.mode)}</td>
                  <td className="py-2 text-zinc-500">{r.rationale}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {snapshot.notes.length > 0 ? (
        <div className="mt-4 border-t border-zinc-800/80 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Notes</p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-500">
            {snapshot.notes.slice(0, 5).map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
