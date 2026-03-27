"use client";

import { useEffect, useState } from "react";
import { StrategyModeSelector } from "@/components/deal/StrategyModeSelector";
import { OfferStrategyCard } from "@/components/deal/OfferStrategyCard";
import { OfferStrategySimulator } from "@/src/modules/offer-strategy-simulator/ui/OfferStrategySimulator";
import { ScenarioHistoryPanel } from "@/src/modules/offer-strategy-simulator/ui/ScenarioHistoryPanel";
import { useOfferStrategyPresentationMode } from "@/src/modules/offer-strategy-simulator/hooks/useOfferStrategyPresentationMode";
import type { CaseHealthSnapshot } from "@/src/modules/case-command-center/domain/case.types";
import type { OfferScenarioInput } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import { isDealAnalyzerOfferAssistantEnabled, isDealAnalyzerStrategyModesEnabled } from "@/modules/deal-analyzer/config";

const STORAGE_PREFIX = "deal-analyzer-strategy-";

/**
 * Offer Strategy Simulator for Case Command Center (same behaviour as property page Phase 3 block).
 */
export function CaseOfferStrategySimulatorSection({
  listingId,
  listPriceCents,
  caseId,
  caseHealthSnapshot,
}: {
  listingId: string;
  listPriceCents: number;
  /** Seller declaration draft id — saved scenario history scope. */
  caseId: string;
  /** When present, future-outcome projection aligns with command center case state. */
  caseHealthSnapshot?: CaseHealthSnapshot | null;
}) {
  const [mode, setMode] = useState("buy_to_live");
  const [restoreNonce, setRestoreNonce] = useState(0);
  const [restoredInput, setRestoredInput] = useState<OfferScenarioInput | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const presentationMode = useOfferStrategyPresentationMode(listingId);
  const showHistory = presentationMode === "internal_mode";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${listingId}`);
      if (raw && typeof raw === "string") queueMicrotask(() => setMode(raw));
    } catch {
      /* ignore */
    }
  }, [listingId]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${listingId}`, mode);
    } catch {
      /* ignore */
    }
  }, [listingId, mode]);

  if (!isDealAnalyzerOfferAssistantEnabled()) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Offer strategy simulator</p>
        <p className="mt-1 text-xs text-slate-500">
          Review scenarios with clients in presentation mode, or switch to internal detail for your team.
        </p>
      </div>
      {isDealAnalyzerStrategyModesEnabled() ? <StrategyModeSelector enabled value={mode} onChange={setMode} /> : null}
      <OfferStrategyCard listingId={listingId} enabled strategyMode={mode} />
      <OfferStrategySimulator
        propertyId={listingId}
        listPriceCents={listPriceCents}
        caseId={caseId}
        caseHealthSnapshot={caseHealthSnapshot}
        restoreNonce={restoreNonce}
        restoredInput={restoredInput}
        onSavedToHistory={() => setHistoryRefresh((x) => x + 1)}
      />
      {showHistory ? (
        <ScenarioHistoryPanel
          propertyId={listingId}
          caseId={caseId}
          refreshKey={historyRefresh}
          onRestore={(input) => {
            setRestoredInput(input);
            setRestoreNonce((n) => n + 1);
          }}
        />
      ) : null}
    </div>
  );
}
