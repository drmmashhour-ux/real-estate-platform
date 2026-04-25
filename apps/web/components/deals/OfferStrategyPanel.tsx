"use client";

import { useCallback, useEffect, useState } from "react";
import { OfferReadinessMeter } from "./OfferReadinessMeter";
import { NegotiationPostureBadge } from "./NegotiationPostureBadge";
import { OfferBlockersPanel } from "./OfferBlockersPanel";
import { CompetitiveRiskCard } from "./CompetitiveRiskCard";
import { OfferRecommendationsList } from "./OfferRecommendationsList";
import type { OfferStrategyOutput } from "@/modules/offer-strategy/offer-strategy.types";

type Props = { dealId: string; enabled?: boolean };

export function OfferStrategyPanel({ dealId, enabled = true }: Props) {
  const [s, setS] = useState<OfferStrategyOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled || !dealId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deals/${encodeURIComponent(dealId)}/offer-strategy`, { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; strategy?: OfferStrategyOutput; error?: string };
      if (j.ok && j.strategy) setS(j.strategy);
      else setErr(j.error ?? "Could not load offer strategy");
    } catch {
      setErr("Could not load offer strategy");
    } finally {
      setLoading(false);
    }
  }, [dealId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!enabled) return null;
  if (loading) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-medium text-slate-200">Offer strategy (AI)</h2>
        <p className="mt-2 text-sm text-slate-500">Loading…</p>
      </section>
    );
  }
  if (err || !s) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-medium text-slate-200">Offer strategy (AI)</h2>
        <p className="mt-2 text-sm text-rose-300">{err ?? "No data"}</p>
        <button type="button" onClick={load} className="mt-2 text-xs text-amber-400 hover:text-amber-300">
          Retry
        </button>
      </section>
    );
  }

  const r = s.readiness;
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-medium text-slate-200">Offer strategy (AI)</h2>
      <p className="mt-1 text-xs text-slate-500">
        Suggestions only — not legal, tax, or guaranteed financial advice. Does not submit or create offers in the platform.
      </p>
      <div className="mt-3 max-w-sm">
        <OfferReadinessMeter score={r.score} label={r.label} />
      </div>
      {r.rationale.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
          {r.rationale.slice(0, 2).map((t) => (
            <li key={t.slice(0, 40)}>{t}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3">
        <p className="text-xs text-slate-500">Posture (communication style)</p>
        <div className="mt-1">
          <NegotiationPostureBadge posture={s.posture} />
        </div>
        {s.posture.rationale.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-xs text-slate-400">
            {s.posture.rationale.map((t) => (
              <li key={t.slice(0, 40)}>{t}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-slate-300">Blockers</h3>
        <div className="mt-1">
          <OfferBlockersPanel blockers={s.blockers} />
        </div>
      </div>
      <div className="mt-4">
        <CompetitiveRiskCard level={s.competitiveRisk.level} rationale={s.competitiveRisk.rationale} />
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-slate-300">Recommended next steps (you choose)</h3>
        <div className="mt-1">
          <OfferRecommendationsList items={s.recommendations} />
        </div>
      </div>
      {s.coachNotes.length > 0 ? (
        <div className="mt-3">
          <h3 className="text-sm font-medium text-slate-300">Coach notes</h3>
          <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
            {s.coachNotes.map((c) => (
              <li key={c.slice(0, 40)}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <button type="button" onClick={load} className="mt-3 text-xs text-amber-400 hover:text-amber-300">
        Refresh
      </button>
    </section>
  );
}
