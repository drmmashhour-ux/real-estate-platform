"use client";

import { useEffect, useRef, useState } from "react";
import { CloseProbabilityGauge } from "@/components/deals/CloseProbabilityGauge";

type Snapshot = {
  dealScore: number;
  closeProbability: number;
  riskLevel: string;
  intelligenceStage: string;
  suggestedAction: string;
  computedAt: string;
  inputsSummary: {
    daysSinceLastActivity: number;
    eventCount14d: number;
    negotiationRoundMax: number;
    rejectedProposals: number;
    listPriceGapPct: number | null;
  };
};

type CloseProbabilityAi = {
  id: string;
  probability: number;
  category: string;
  drivers: string[];
  risks: string[];
  createdAt: string;
};

export function DealIntelligencePanel({ dealId }: { dealId: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [closeAi, setCloseAi] = useState<CloseProbabilityAi | null>(null);
  const [advisory, setAdvisory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const viewLogged = useRef(false);

  useEffect(() => {
    if (viewLogged.current) return;
    const k = `deal_intel_view_${dealId}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(k)) {
      viewLogged.current = true;
      return;
    }
    viewLogged.current = true;
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(k, "1");
    void fetch(`/api/deal/${dealId}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ type: "VIEW" }),
    }).catch(() => undefined);
  }, [dealId]);

  useEffect(() => {
    fetch(`/api/deal/${dealId}/score`, { credentials: "same-origin" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error ?? "Unable to load");
        return data as { snapshot: Snapshot; advisory?: string; closeProbabilityAi?: CloseProbabilityAi | null };
      })
      .then((data) => {
        setSnapshot(data.snapshot);
        setCloseAi(data.closeProbabilityAi ?? null);
        setAdvisory(data.advisory ?? null);
      })
      .catch(() => {
        setError("Could not load deal intelligence.");
      });
  }, [dealId]);

  async function runCloseProbabilityAi() {
    setAiBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/close-probability`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        prediction?: CloseProbabilityAi;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.prediction) {
        throw new Error(data.error ?? "Close probability run failed");
      }
      setCloseAi({
        id: data.prediction.id,
        probability: data.prediction.probability,
        category: data.prediction.category,
        drivers: data.prediction.drivers ?? [],
        risks: data.prediction.risks ?? [],
        createdAt: data.prediction.createdAt,
      });
    } catch {
      setError("Could not refresh close probability AI.");
    } finally {
      setAiBusy(false);
    }
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <h3 className="font-medium text-ds-text">Deal intelligence</h3>
        <p className="mt-2 text-sm text-ds-text-secondary">{error}</p>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <h3 className="font-medium text-ds-text">Deal intelligence</h3>
        <p className="mt-2 text-sm text-ds-text-secondary">Loading…</p>
      </section>
    );
  }

  const cpPct = Math.round(snapshot.closeProbability * 100);

  return (
    <section
      className="rounded-2xl border border-ds-border bg-gradient-to-br from-ds-card/90 to-black/40 p-5 shadow-ds-soft"
      aria-labelledby="deal-intel-heading"
    >
      <h3 id="deal-intel-heading" className="font-medium text-ds-text">
        Deal intelligence
      </h3>
      {advisory ? <p className="mt-2 text-[11px] leading-relaxed text-ds-text-secondary">{advisory}</p> : null}

      <div className="mt-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ds-text-secondary">
            Close probability AI
          </p>
          <button
            type="button"
            disabled={aiBusy}
            onClick={() => void runCloseProbabilityAi()}
            className="rounded-lg border border-ds-border bg-white/5 px-3 py-1.5 text-[11px] font-medium text-ds-text hover:bg-white/10 disabled:opacity-50"
          >
            {aiBusy ? "Computing…" : closeAi ? "Refresh estimate" : "Run estimate"}
          </button>
        </div>
        {closeAi ? (
          <CloseProbabilityGauge
            probability={closeAi.probability}
            category={closeAi.category}
            drivers={closeAi.drivers}
            risks={closeAi.risks}
          />
        ) : (
          <p className="text-xs text-ds-text-secondary">
            No AI snapshot yet — run an estimate to blend financing, inspection, pricing, negotiation, seller signals,
            documents, and timeline.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ds-text-secondary">Deal score</p>
          <p className="mt-1 font-mono text-3xl text-ds-gold">{snapshot.dealScore}</p>
          <p className="text-[11px] text-ds-text-secondary">0–100 · rule blend</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ds-text-secondary">
            Close probability (model prior)
          </p>
          <p className="mt-1 font-mono text-3xl text-emerald-300">{cpPct}%</p>
          <p className="text-[11px] text-ds-text-secondary">Not a guarantee</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ds-text-secondary">Risk level</p>
          <p className="mt-1 font-mono text-2xl text-ds-text">{snapshot.riskLevel}</p>
          <p className="text-[11px] text-ds-text-secondary">Ops signals</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-ds-border/80 bg-black/25 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ds-text-secondary">
          Suggested next step
        </p>
        <p className="mt-2 text-lg font-medium text-white">{snapshot.suggestedAction}</p>
        <p className="mt-1 text-xs text-ds-text-secondary">
          Stage lens: {snapshot.intelligenceStage} · Last computed {snapshot.computedAt.slice(0, 16)} · Idle{" "}
          {snapshot.inputsSummary.daysSinceLastActivity.toFixed(0)}d · Events (14d){" "}
          {snapshot.inputsSummary.eventCount14d}
        </p>
      </div>
    </section>
  );
}
