"use client";

import * as React from "react";
import type { GrowthExecutiveSummary } from "@/modules/growth/growth-executive.types";

function statusBadge(s: GrowthExecutiveSummary["status"]): string {
  if (s === "strong") return "border-emerald-500/50 bg-emerald-950/40 text-emerald-100";
  if (s === "healthy") return "border-sky-500/45 bg-sky-950/30 text-sky-100";
  if (s === "watch") return "border-amber-500/50 bg-amber-950/35 text-amber-100";
  return "border-rose-500/45 bg-rose-950/35 text-rose-100";
}

function impactBadge(i: string): string {
  if (i === "high") return "border-rose-500/35 bg-rose-950/25 text-rose-100";
  if (i === "medium") return "border-amber-500/35 bg-amber-950/25 text-amber-100";
  return "border-zinc-600 bg-zinc-800/80 text-zinc-300";
}

export function GrowthExecutivePanel({ showLearningControlReviewLine }: { showLearningControlReviewLine?: boolean }) {
  const [summary, setSummary] = React.useState<GrowthExecutiveSummary | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [learningReviewLine, setLearningReviewLine] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!showLearningControlReviewLine) {
      setLearningReviewLine(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/growth/learning", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json() as Promise<{ learningControl?: { state?: string } }>;
      })
      .then((j) => {
        if (cancelled || !j?.learningControl?.state) return;
        if (j.learningControl.state !== "normal") {
          setLearningReviewLine("Learning system requires review (control plane advisory).");
        } else {
          setLearningReviewLine(null);
        }
      })
      .catch(() => {
        if (!cancelled) setLearningReviewLine(null);
      });
    return () => {
      cancelled = true;
    };
  }, [showLearningControlReviewLine]);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/executive", { credentials: "same-origin" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Executive panel load failed");
        return j as { summary: GrowthExecutiveSummary };
      })
      .then((j) => {
        if (!cancelled) setSummary(j.summary);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!summary) return <p className="text-sm text-zinc-500">Loading executive snapshot…</p>;

  const prios = summary.topPriorities.slice(0, 5);

  return (
    <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/25 p-4">
      <h3 className="text-sm font-semibold text-indigo-100">📈 Growth Executive Panel</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Read-only company snapshot — no execution. Source systems and approvals stay authoritative.
      </p>

      {learningReviewLine ? (
        <p className="mt-2 text-xs text-amber-200/90">⚠ {learningReviewLine}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadge(summary.status)}`}
        >
          {summary.status}
        </span>
      </div>

      {summary.topPriority ? (
        <p className="mt-3 rounded-lg border border-indigo-800/50 bg-black/25 px-3 py-2 text-sm text-indigo-100/95">
          🎯 Top Priority: <span className="font-medium text-white">{summary.topPriority}</span>
        </p>
      ) : null}

      {summary.topRisks.length > 0 ? (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Top risks</p>
          <ul className="mt-2 space-y-1 text-xs text-rose-200/85">
            {summary.topRisks.slice(0, 5).map((r, i) => (
              <li key={`${i}-${r.slice(0, 48)}`} className="border-l border-rose-500/30 pl-2">
                {r}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Top priorities</p>
        <ul className="mt-2 space-y-2">
          {prios.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-sm text-zinc-300"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-zinc-100">{p.title}</span>
                <span className="rounded border border-indigo-800/60 px-1 text-[10px] uppercase text-indigo-200/90">
                  {p.source}
                </span>
                <span className={`rounded border px-1 text-[10px] ${impactBadge(p.impact)}`}>{p.impact}</span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">{p.why}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid gap-3 border-t border-indigo-900/40 pt-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Campaigns (UTM snapshot)</p>
          <p className="mt-1 text-xs text-zinc-400">
            Total: <strong className="text-zinc-200">{summary.campaignSummary.totalCampaigns}</strong>
            {summary.campaignSummary.topCampaign ? (
              <>
                {" "}
                · Top: <strong className="text-zinc-200">{summary.campaignSummary.topCampaign}</strong>
              </>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Performance band:{" "}
            <strong className="text-zinc-200">{summary.campaignSummary.adsPerformance}</strong>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Leads</p>
          <p className="mt-1 text-xs text-zinc-400">
            CRM total: <strong className="text-zinc-200">{summary.leadSummary.totalLeads}</strong> · Hot / high
            score: <strong className="text-zinc-200">{summary.leadSummary.hotLeads}</strong>
          </p>
          {summary.leadSummary.dueNow != null ? (
            <p className="mt-1 text-xs text-amber-200/80">Due now (follow-up queue): {summary.leadSummary.dueNow}</p>
          ) : null}
        </div>
      </div>

      {summary.governance ? (
        <div className="mt-4 border-t border-indigo-900/40 pt-3">
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Governance</p>
          <p className="mt-1 text-xs text-zinc-400">
            Status: <strong className="text-zinc-200">{summary.governance.status.replace(/_/g, " ")}</strong>
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Blocked: {summary.governance.blockedDomains.length ? summary.governance.blockedDomains.join(", ") : "—"} ·
            Frozen (advisory):{" "}
            {summary.governance.frozenDomains.length ? summary.governance.frozenDomains.join(", ") : "—"}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-[11px] text-zinc-600">Governance layer off or unavailable.</p>
      )}

      {summary.autopilot ? (
        <div className="mt-3 border-t border-indigo-900/40 pt-3">
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Autopilot</p>
          <p className="mt-1 text-xs text-zinc-400">
            Status: <strong className="text-zinc-200">{summary.autopilot.status ?? "—"}</strong> · Actions:{" "}
            <strong className="text-zinc-200">{summary.autopilot.topActionCount}</strong>
          </p>
          {summary.autopilot.focusTitle ? (
            <p className="mt-1 text-xs text-violet-200/90">Focus: {summary.autopilot.focusTitle}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-zinc-600">Autopilot payload unavailable.</p>
      )}
    </div>
  );
}
