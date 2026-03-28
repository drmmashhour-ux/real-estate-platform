"use client";

import { useMemo } from "react";
import type { CaseHealthSnapshot } from "@/src/modules/case-command-center/domain/case.types";
import { simulateFutureOutcome } from "@/src/modules/future-outcome-simulator/application/simulateFutureOutcome";
import {
  futureOutcomeCaseInputFromSnapshot,
  futureOutcomeDealSignalsFromSnapshot,
} from "@/src/modules/future-outcome-simulator/application/futureOutcomeCaseMapper";
import type { OfferScenarioInput, OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import { RequiredActionsList } from "@/src/modules/future-outcome-simulator/ui/RequiredActionsList";
import { RequiredDocumentsList } from "@/src/modules/future-outcome-simulator/ui/RequiredDocumentsList";
import { RiskPreview } from "@/src/modules/future-outcome-simulator/ui/RiskPreview";
import { TimelinePreview } from "@/src/modules/future-outcome-simulator/ui/TimelinePreview";

type Props = {
  propertyId: string;
  listPriceCents: number;
  scenarioInput: OfferScenarioInput;
  simulationResult: OfferSimulationResult;
  caseHealthSnapshot?: CaseHealthSnapshot | null;
  presentationMode?: boolean;
};

function confidenceLabel(level: string): string {
  if (level === "high") return "Clearer illustration — fewer open file gaps in this snapshot.";
  if (level === "medium") return "Moderate uncertainty — confirm sequencing with your broker.";
  return "Higher uncertainty — file gaps or blockers widen what could change.";
}

export function FutureOutcomePanel({
  propertyId,
  listPriceCents,
  scenarioInput,
  simulationResult,
  caseHealthSnapshot,
  presentationMode = false,
}: Props) {
  const outcome = useMemo(
    () =>
      simulateFutureOutcome({
        propertyId,
        listPriceCents,
        scenarioInput,
        simulationResult,
        caseState: caseHealthSnapshot ? futureOutcomeCaseInputFromSnapshot(caseHealthSnapshot) : null,
        dealSignals: caseHealthSnapshot ? futureOutcomeDealSignalsFromSnapshot(caseHealthSnapshot) : null,
      }),
    [propertyId, listPriceCents, scenarioInput, simulationResult, caseHealthSnapshot],
  );

  return (
    <div className="space-y-4 rounded-xl border border-premium-gold/20 bg-gradient-to-b from-[#141414] to-black/40 p-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">If this scenario moves forward</p>
        <p className="mt-1 text-xs text-slate-500">
          {presentationMode
            ? "A simple picture of what often comes next — not a promise of dates or acceptance."
            : "Illustrative sequence grounded in your scenario settings and (when available) the live case snapshot — advisory only."}
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/25 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Readiness (model + case)</p>
        <p className="mt-1 text-sm font-medium text-slate-200">{outcome.readinessImpact.bandLabel}</p>
        <p className="mt-1 text-xs text-slate-400">{outcome.readinessImpact.caseAlignmentNote}</p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Likely sequence</p>
        <div className="mt-2">
          <TimelinePreview steps={outcome.timelineSteps} compact={presentationMode} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Possible risks</p>
          <div className="mt-2">
            <RiskPreview risks={outcome.possibleRisks} compact={presentationMode} />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">What to plan for</p>
            <div className="mt-2">
              <RequiredActionsList actions={outcome.requiredActions} />
            </div>
          </div>
          {!presentationMode ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Documents to expect</p>
              <div className="mt-2">
                <RequiredDocumentsList documents={outcome.requiredDocuments} />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-white/5 bg-black/30 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase text-slate-500">Confidence</p>
        <p className="mt-1 text-xs text-slate-300">{confidenceLabel(outcome.confidenceLevel)}</p>
        {!presentationMode ? (
          <p className="mt-1 text-[10px] text-slate-600">Simulator confidence: {outcome.simulationConfidence}</p>
        ) : null}
      </div>

      {outcome.warnings.length ? (
        <ul className="space-y-1 text-[11px] text-amber-200/80">
          {outcome.warnings.map((w, i) => (
            <li key={i}>• {w}</li>
          ))}
        </ul>
      ) : null}

      <p className="text-[10px] leading-relaxed text-slate-600">{outcome.advisoryDisclaimer}</p>
    </div>
  );
}
