"use client";

import * as React from "react";
import type {
  GrowthGovernanceDecision,
  GrowthGovernanceDomain,
  GrowthGovernanceFreezeState,
  GrowthHumanReviewItem,
} from "@/modules/growth/growth-governance.types";

function statusBadgeClass(s: GrowthGovernanceDecision["status"]): string {
  if (s === "healthy") return "border-emerald-500/50 bg-emerald-950/40 text-emerald-200";
  if (s === "watch") return "border-sky-500/40 bg-sky-950/30 text-sky-100";
  if (s === "caution") return "border-amber-500/50 bg-amber-950/40 text-amber-100";
  if (s === "freeze_recommended") return "border-violet-500/50 bg-violet-950/40 text-violet-100";
  return "border-rose-500/50 bg-rose-950/40 text-rose-100";
}

function domainChip(d: GrowthGovernanceDomain): string {
  return "rounded border border-slate-700/80 bg-slate-900/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300";
}

function sevBadge(s: GrowthHumanReviewItem["severity"]): string {
  if (s === "high") return "text-rose-300/90";
  if (s === "medium") return "text-amber-200/90";
  return "text-zinc-500";
}

export function GrowthGovernancePanel() {
  const [decision, setDecision] = React.useState<GrowthGovernanceDecision | null>(null);
  const [freezeState, setFreezeState] = React.useState<GrowthGovernanceFreezeState | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/governance", { credentials: "same-origin" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Governance load failed");
        return j as {
          decision: GrowthGovernanceDecision;
          freezeState?: GrowthGovernanceFreezeState;
          freeze?: GrowthGovernanceFreezeState;
        };
      })
      .then((j) => {
        if (!cancelled) {
          setDecision(j.decision);
          setFreezeState(j.freezeState ?? j.freeze ?? null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!decision) {
    return <p className="text-sm text-zinc-500">Loading growth governance…</p>;
  }

  const structured = decision.humanReviewQueue ?? [];
  const fallbackLines = decision.humanReviewItems ?? [];
  const showQueue = structured.length > 0 || fallbackLines.length > 0;

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
      <h3 className="text-sm font-semibold text-slate-100">🛡 Growth Governance</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Advisory classification only — does not change execution, spend, or feature flags.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(decision.status)}`}
        >
          {decision.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Top risks</p>
        <ul className="mt-1 list-inside list-disc text-sm text-zinc-300">
          {decision.topRisks.slice(0, 3).map((r) => (
            <li key={r.id}>
              <span className={domainChip(r.category)}>{r.category}</span> {r.title}
              {r.description ? (
                <span className="mt-0.5 block pl-0 text-[11px] text-zinc-500">{r.description.slice(0, 160)}</span>
              ) : null}
            </li>
          ))}
          {decision.topRisks.length === 0 ? <li className="text-zinc-600">None flagged</li> : null}
        </ul>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Blocked / deprioritized</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {decision.blockedDomains.length > 0 ? (
              decision.blockedDomains.map((d) => (
                <span key={d} className={domainChip(d)}>
                  {d}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-600">—</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Advisory frozen domains</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {decision.frozenDomains.length > 0 ? (
              decision.frozenDomains.map((d) => (
                <span key={d} className={domainChip(d)}>
                  {d}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-600">—</span>
            )}
          </div>
        </div>
      </div>

      {freezeState?.rationale && freezeState.rationale.length > 0 ? (
        <div className="mt-3 rounded-lg border border-slate-800/60 bg-black/15 px-2 py-2">
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Freeze rationale (advisory)</p>
          <ul className="mt-1 space-y-1 text-[11px] text-zinc-500">
            {freezeState.rationale.slice(0, 3).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {showQueue ? (
        <div className="mt-4 border-t border-slate-800/80 pt-3">
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Human review queue</p>
          {structured.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {structured.slice(0, 8).map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-800/80 bg-black/20 px-2 py-1.5 text-xs text-zinc-300">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={domainChip(item.category)}>{item.category}</span>
                    <span className={`text-[10px] uppercase ${sevBadge(item.severity)}`}>{item.severity}</span>
                  </div>
                  <p className="mt-0.5 font-medium text-zinc-100">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{item.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-1 space-y-1 text-xs text-zinc-400">
              {fallbackLines.slice(0, 8).map((line, i) => (
                <li key={i}>• {line}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="mt-4 text-[11px] text-zinc-600">Human review queue empty (or escalation flag off).</p>
      )}

      <div className="mt-3 border-t border-slate-800/80 pt-3">
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Notes</p>
        <ul className="mt-1 space-y-0.5 text-[11px] text-zinc-500">
          {decision.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
