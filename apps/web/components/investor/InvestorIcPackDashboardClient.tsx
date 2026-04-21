"use client";

import * as React from "react";

type IcPayload = {
  cover: { recommendation: string; confidenceLevel: string; listingTitle: string };
  decisionFrame: { recommendation: string; proceedConditions: string[]; noGoTriggers: string[] };
  riskAssessment: {
    criticalRisks: string[];
    highRisks: string[];
    mediumRisks: string[];
    mitigants: string[];
  };
  esgSection: { evidenceStrength: string; carbonSummary: string; redFlags: string[] };
  acquisitionSection: { screenStatus: string; blockers: string[]; requiredDiligence: string[] };
  actionPlan: { topImmediateActions: string[]; quickWins: string[]; strategicActions: string[] };
  retrofitPlan: { selectedPlan: string | null; phaseRoadmap: string[]; financingMatches: string[] };
  optimizerSection: {
    selectedStrategy: string | null;
    topRecommendedActions: string[];
    expectedDirectionalImprovement: string | null;
  };
  finalRecommendation: { recommendation: string; rationale: string; followUpItems: string[] };
  disclaimers: { adviceDisclaimer: string };
  partialOutput?: boolean;
};

export function InvestorIcPackDashboardClient({
  listingId,
  initialPayload,
}: {
  listingId: string;
  initialPayload: IcPayload | null;
}) {
  const [payload, setPayload] = React.useState<IcPayload | null>(initialPayload);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/investor/ic-pack/${listingId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionStage: "IC_REVIEW" }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Generation failed");
      }
      const data = (await res.json()) as { payload: IcPayload };
      setPayload(data.payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/investor/ic-pack/${listingId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Load failed");
      const data = (await res.json()) as { icPack: { payload: IcPayload } | null };
      setPayload(data.icPack?.payload ?? null);
    } catch {
      setError("Could not refresh IC pack");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-zinc-100">Investment Committee pack</h1>
          <p className="mt-1 text-sm text-zinc-400">{payload?.cover.listingTitle ?? `Listing ${listingId}`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={generate}
            className="rounded-lg border border-amber-700/60 bg-zinc-900 px-3 py-2 text-sm text-amber-100 hover:bg-zinc-800 disabled:opacity-50"
          >
            Generate IC pack
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={refresh}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 disabled:opacity-50"
          >
            Refresh
          </button>
          <a
            href={`/api/investor/ic-pack/${listingId}/download`}
            className="rounded-lg bg-amber-700/90 px-3 py-2 text-sm font-medium text-black hover:bg-amber-600"
          >
            Export PDF
          </a>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {!payload ?
        <p className="text-zinc-400">Generate a committee pack from structured listing intelligence.</p>
      : <div className="space-y-8">
          {payload.partialOutput ?
            <div className="rounded-lg border border-amber-800/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
              Partial output — strengthen ESG evidence and acquisition snapshots before final committee use.
            </div>
          : null}

          <section className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-amber-100">
                {payload.finalRecommendation.recommendation.replace(/_/g, " ")}
              </span>
              <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-xs text-zinc-300">
                {payload.cover.confidenceLevel}
              </span>
              <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-xs text-zinc-400">
                {payload.acquisitionSection.screenStatus}
              </span>
            </div>
            <p className="mt-4 text-sm text-zinc-300">{payload.finalRecommendation.rationale}</p>
          </section>

          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Decision framing</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-xs uppercase text-zinc-500">Proceed conditions</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
                  {payload.decisionFrame.proceedConditions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs uppercase text-zinc-500">No-go triggers</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
                  {payload.decisionFrame.noGoTriggers.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Risk table</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                    <th className="py-2 pr-4">Severity</th>
                    <th className="py-2">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {(["critical", "high", "medium"] as const).map((sev) => {
                    const rows =
                      sev === "critical" ? payload.riskAssessment.criticalRisks
                      : sev === "high" ? payload.riskAssessment.highRisks
                      : payload.riskAssessment.mediumRisks;
                    return (
                      <tr key={sev} className="border-b border-zinc-900 align-top">
                        <td className="py-3 pr-4 capitalize text-zinc-300">{sev}</td>
                        <td className="py-3">
                          <ul className="list-disc space-y-1 pl-4">
                            {rows.map((r) => (
                              <li key={r}>{r}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-zinc-500">Mitigants: {payload.riskAssessment.mitigants.join(" · ")}</p>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-zinc-800 p-4">
              <h2 className="text-sm font-semibold text-zinc-200">ESG & evidence</h2>
              <p className="mt-2 text-sm text-zinc-400">{payload.esgSection.evidenceStrength}</p>
              <p className="mt-2 text-sm text-zinc-400">{payload.esgSection.carbonSummary}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-300/90">
                {payload.esgSection.redFlags.slice(0, 8).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-zinc-800 p-4">
              <h2 className="text-sm font-semibold text-zinc-200">Acquisition blockers</h2>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-zinc-400">
                {payload.acquisitionSection.blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <h3 className="mt-4 text-xs uppercase text-zinc-500">Required diligence</h3>
              <ul className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-400">
                {payload.acquisitionSection.requiredDiligence.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Action / retrofit / financing</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="text-xs uppercase text-zinc-500">Immediate</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-400">
                  {payload.actionPlan.topImmediateActions.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs uppercase text-zinc-500">Retrofit</h3>
                <p className="mt-2 text-sm text-zinc-400">{payload.retrofitPlan.selectedPlan ?? "—"}</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-400">
                  {payload.retrofitPlan.phaseRoadmap.slice(0, 6).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs uppercase text-zinc-500">Financing matches</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-400">
                  {payload.retrofitPlan.financingMatches.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Optimizer summary</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Strategy {payload.optimizerSection.selectedStrategy ?? "—"} ·{" "}
              {payload.optimizerSection.expectedDirectionalImprovement ?? ""}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
              {payload.optimizerSection.topRecommendedActions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Final recommendation & follow-ups</h2>
            <ul className="mt-2 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
              {payload.finalRecommendation.followUpItems.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-700/60 bg-black/30 p-4 text-xs text-zinc-500">
            {payload.disclaimers.adviceDisclaimer}
          </section>
        </div>
      }
    </div>
  );
}
