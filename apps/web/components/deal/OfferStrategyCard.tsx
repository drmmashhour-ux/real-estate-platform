"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OfferStrategyPublicDto } from "@/modules/deal-analyzer/domain/contracts";
import {
  PresentationModeToggle,
  ScenarioNextStepCard,
  ScenarioPresentationCard,
  ScenarioProtectionsPanel,
  ScenarioRisksPanel,
  ScenarioSummaryPanel,
} from "@/components/deal/offer-strategy-presentation";
import type { OfferStrategySimulatorMode } from "@/components/deal/offer-strategy-presentation/types";
import { trackOfferStrategyPresentationEvent } from "@/lib/analytics/offerStrategyPresentation";

const MODE_STORAGE_PREFIX = "offer-strategy-sim-mode-";

type Props = {
  listingId: string;
  enabled: boolean;
  strategyMode: string;
};

export function OfferStrategyCard({ listingId, enabled, strategyMode }: Props) {
  const [dto, setDto] = useState<OfferStrategyPublicDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [presentationMode, setPresentationMode] = useState<OfferStrategySimulatorMode>("client_presentation_mode");
  const analyticsSigRef = useRef<string>("");
  const sharedLaterRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${MODE_STORAGE_PREFIX}${listingId}`);
      if (raw === "internal_mode" || raw === "client_presentation_mode") {
        setPresentationMode(raw);
      }
    } catch {
      /* ignore */
    }
  }, [listingId]);

  const setModeAndPersist = useCallback((next: OfferStrategySimulatorMode) => {
    setPresentationMode(next);
    try {
      localStorage.setItem(`${MODE_STORAGE_PREFIX}${listingId}`, next);
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lecipm-offer-strategy-presentation-mode", { detail: { listingId, mode: next } }),
      );
    }
  }, [listingId]);

  useEffect(() => {
    sharedLaterRef.current = false;
    analyticsSigRef.current = "";
  }, [listingId]);

  useEffect(() => {
    if (!enabled || !dto) return;
    const sig = `${presentationMode}|${dto.id}|${dto.updatedAt}`;
    if (analyticsSigRef.current === sig) return;
    analyticsSigRef.current = sig;
    if (presentationMode === "client_presentation_mode") {
      trackOfferStrategyPresentationEvent("offer_strategy_presentation_mode_viewed", { listingId, strategyMode });
      if (!sharedLaterRef.current) {
        sharedLaterRef.current = true;
        trackOfferStrategyPresentationEvent("offer_strategy_presentation_shared_later_ready", { listingId, strategyMode });
      }
    } else {
      trackOfferStrategyPresentationEvent("offer_strategy_internal_mode_viewed", { listingId, strategyMode });
    }
  }, [enabled, dto, presentationMode, listingId, strategyMode]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/deal-analyzer/properties/${encodeURIComponent(listingId)}/offer-strategy`, {
      credentials: "include",
    });
    if (res.status === 503) return;
    const j = (await res.json()) as { offerStrategy?: OfferStrategyPublicDto | null };
    setDto(j.offerStrategy ?? null);
  }, [listingId]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deal-analyzer/properties/${encodeURIComponent(listingId)}/offer-strategy/run`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyMode }),
      });
      const j = (await res.json()) as { offerStrategy?: OfferStrategyPublicDto | null; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Could not run offer assistant");
        return;
      }
      setDto(j.offerStrategy ?? null);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) return null;

  return (
    <div className="rounded-2xl border border-[#C9A646]/20 bg-[#121212] p-5 print:bg-white print:text-black">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Offer strategy assistant</p>
          <p className="mt-2 text-xs text-slate-500 print:text-neutral-600">
            Educational bands only — not legal or brokerage advice. Does not guarantee acceptance.
          </p>
        </div>
        <PresentationModeToggle mode={presentationMode} onChange={setModeAndPersist} />
      </div>
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="mt-4 rounded-full border border-[#C9A646]/50 bg-[#C9A646]/10 px-4 py-2 text-xs font-semibold text-[#C9A646] transition hover:bg-[#C9A646]/20 disabled:opacity-50 print:hidden"
      >
        {loading ? "Running…" : "Refresh offer guidance"}
      </button>
      {err ? <p className="mt-2 text-xs text-red-300 print:text-red-800">{err}</p> : null}
      {dto && presentationMode === "client_presentation_mode" ? (
        <div className="offer-strategy-presentation mt-4 print:max-w-none">
          <ScenarioPresentationCard>
            <ScenarioSummaryPanel strategyMode={strategyMode} dto={dto} />
            <ScenarioProtectionsPanel dto={dto} />
            <ScenarioRisksPanel dto={dto} />
            <ScenarioNextStepCard dto={dto} />
          </ScenarioPresentationCard>
        </div>
      ) : null}
      {dto && presentationMode === "internal_mode" ? (
        <div className="mt-4 space-y-3 text-sm text-slate-300 print:hidden">
          <p>
            <span className="text-slate-500">Posture:</span>{" "}
            <span className="font-medium text-white">{dto.offerPosture.replace(/_/g, " ")}</span>
            {" · "}
            <span className="text-slate-500">Band:</span>{" "}
            <span className="font-medium text-white">{dto.offerBand.replace(/_/g, " ")}</span>
          </p>
          <p>
            <span className="text-slate-500">Confidence:</span>{" "}
            <span className="font-medium text-amber-200/90">{dto.confidenceLevel}</span>
            {" · "}
            <span className="text-slate-500">Risk level (model):</span>{" "}
            <span className="font-medium text-amber-200/90">{dto.riskLevel}</span>
          </p>
          {dto.competitionSignal ? (
            <p>
              <span className="text-slate-500">Competition signal:</span>{" "}
              <span className="font-mono text-xs text-slate-400">{dto.competitionSignal}</span>
            </p>
          ) : null}
          {dto.suggestedTargetOfferCents != null ? (
            <p className="font-mono text-xs text-slate-400">
              Suggested range (illustrative):{" "}
              {dto.suggestedMinOfferCents != null ? `$${(dto.suggestedMinOfferCents / 100).toLocaleString()}` : "—"} — $
              {(dto.suggestedTargetOfferCents / 100).toLocaleString()} —{" "}
              {dto.suggestedMaxOfferCents != null ? `$${(dto.suggestedMaxOfferCents / 100).toLocaleString()}` : "—"}
            </p>
          ) : (
            <p className="text-xs text-slate-500">Insufficient comparable or listing data for numeric bands.</p>
          )}
          {dto.recommendedConditions.length > 0 ? (
            <ul className="list-inside list-disc text-xs text-slate-400">
              {dto.recommendedConditions.slice(0, 8).map((c) => (
                <li key={`${c.category}-${c.label}`}>
                  [{c.category}] {c.label}
                  {c.note ? ` — ${c.note}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {dto.warnings.length > 0 ? (
            <ul className="space-y-1 text-xs text-amber-200/85">
              {dto.warnings.map((w) => (
                <li key={w.slice(0, 48)}>{w}</li>
              ))}
            </ul>
          ) : null}
          {dto.explanation ? <p className="text-xs leading-relaxed text-slate-500">{dto.explanation}</p> : null}
        </div>
      ) : null}
      {!dto ? (
        <p className="mt-4 text-xs text-slate-500 print:text-neutral-600">
          Run the Deal Analyzer (Phase 1) first, then refresh offer guidance.
        </p>
      ) : null}
    </div>
  );
}
