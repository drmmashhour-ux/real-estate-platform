"use client";

import * as React from "react";

type MemoPayload = {
  headline: { recommendation: string; confidenceLevel: string; shortSummary: string };
  executiveSummary: string;
  strengths: string[];
  risks: string[];
  esgSummary: {
    esgScore: number | null;
    esgGrade: string | null;
    confidenceLevel: string;
    carbonSummary: string;
    verifiedVsEstimatedNote: string;
  };
  acquisitionSummary: {
    screenStatus: string;
    whyItPassesOrFails: string;
  };
  nextSteps: string[];
  disclaimers: { adviceDisclaimer: string };
  partialOutput?: boolean;
};

export function InvestorMemoDashboardClient({
  listingId,
  initialPayload,
}: {
  listingId: string;
  initialPayload: MemoPayload | null;
}) {
  const [payload, setPayload] = React.useState<MemoPayload | null>(initialPayload);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function generate(t: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/investor/memo/${listingId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoType: t }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Generation failed");
      }
      const data = (await res.json()) as { payload: MemoPayload };
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
      const res = await fetch(`/api/investor/memo/${listingId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Load failed");
      const data = (await res.json()) as { memo: { payload: MemoPayload } | null };
      setPayload(data.memo?.payload ?? null);
    } catch {
      setError("Could not refresh memo");
    } finally {
      setBusy(false);
    }
  }

  const badge =
    payload?.headline.recommendation === "PROCEED" ?
      "bg-emerald-900/80 text-emerald-100"
    : payload?.headline.recommendation === "DECLINE" ?
      "bg-red-900/70 text-red-100"
    : payload?.headline.recommendation === "HOLD" ?
      "bg-amber-900/70 text-amber-100"
    : "bg-zinc-800 text-zinc-100";

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-zinc-100">Investor memo</h1>
          <p className="mt-1 text-sm text-zinc-400">Listing {listingId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => generate("PRELIMINARY")}
            className="rounded-lg border border-amber-700/60 bg-zinc-900 px-3 py-2 text-sm text-amber-100 hover:bg-zinc-800 disabled:opacity-50"
          >
            Generate preliminary
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => generate("ACQUISITION")}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
          >
            Acquisition memo
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
            href={`/api/investor/memo/${listingId}/download`}
            className="rounded-lg bg-amber-700/90 px-3 py-2 text-sm font-medium text-black hover:bg-amber-600"
          >
            Export PDF
          </a>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {!payload ?
        <p className="text-zinc-400">
          No memo generated yet. Choose a memo type — output is grounded in listing ESG and acquisition snapshots.
        </p>
      : <div className="space-y-8">
          {payload.partialOutput ?
            <div className="rounded-lg border border-amber-800/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
              Partial output — key structured fields are missing; review data gaps in the memo payload after export.
            </div>
          : null}

          <section className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badge}`}>
                {payload.headline.recommendation.replace(/_/g, " ")}
              </span>
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                Confidence: {payload.headline.confidenceLevel}
              </span>
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
                Screen: {payload.acquisitionSummary.screenStatus}
              </span>
              <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-xs text-amber-200/90">
                estimated vs verified — see ESG panel
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-zinc-200">{payload.headline.shortSummary}</p>
          </section>

          <section>
            <h2 className="font-medium text-zinc-200">Executive summary</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{payload.executiveSummary}</p>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-zinc-800 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400">Strengths</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                {payload.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-zinc-800 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-red-400">Risks</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                {payload.risks.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">ESG summary</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Score {payload.esgSummary.esgScore ?? "—"} · Grade {payload.esgSummary.esgGrade ?? "—"} · Confidence{" "}
              {payload.esgSummary.confidenceLevel}
            </p>
            <p className="mt-2 text-sm text-zinc-400">{payload.esgSummary.carbonSummary}</p>
            <p className="mt-2 text-xs text-zinc-500">{payload.esgSummary.verifiedVsEstimatedNote}</p>
          </section>

          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Acquisition summary</h2>
            <p className="mt-2 text-sm text-zinc-400">{payload.acquisitionSummary.whyItPassesOrFails}</p>
          </section>

          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Next steps</h2>
            <ul className="mt-2 list-decimal space-y-2 pl-5 text-sm text-zinc-300">
              {payload.nextSteps.map((s) => (
                <li key={s}>{s}</li>
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
