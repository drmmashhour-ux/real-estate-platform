"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { posthog } from "@/components/analytics/PostHogClient";
import { isDealAnalyzerOfferAssistantEnabled } from "@/modules/deal-analyzer/config";
import type {
  OfferScenarioInput,
  OfferSimulationResult,
  ScenarioComparisonResult,
} from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import {
  OfferScenarioInputs,
  defaultOfferDraft,
  draftToInput,
  inputToDraft,
  type OfferDraft,
} from "@/src/modules/offer-strategy-simulator/ui/OfferScenarioInputs";
import { OfferScenarioResults } from "@/src/modules/offer-strategy-simulator/ui/OfferScenarioResults";
import { OfferScenarioWarnings } from "@/src/modules/offer-strategy-simulator/ui/OfferScenarioWarnings";
import { OfferScenarioNextActions } from "@/src/modules/offer-strategy-simulator/ui/OfferScenarioNextActions";
import { OfferScenarioComparison } from "@/src/modules/offer-strategy-simulator/ui/OfferScenarioComparison";
import { OfferScenarioPresentationView } from "@/src/modules/offer-strategy-simulator/ui/OfferScenarioPresentationView";
import { useOfferStrategyPresentationMode } from "@/src/modules/offer-strategy-simulator/hooks/useOfferStrategyPresentationMode";
import { ADVISORY_ONLY_NOTICE } from "@/src/modules/offer-strategy-simulator/policies/offerSimulatorSafety";
import type { CaseHealthSnapshot } from "@/src/modules/case-command-center/domain/case.types";
import { FutureOutcomePanel } from "@/src/modules/future-outcome-simulator/ui/FutureOutcomePanel";

function compareDraftDefaults(): [OfferDraft, OfferDraft, OfferDraft] {
  const base = defaultOfferDraft();
  return [
    { ...base, offerRatio: 0.97 },
    { ...base, offerRatio: 1 },
    { ...base, offerRatio: 1.02, financingCondition: false },
  ];
}

const COMPARE_LABELS = ["Conservative", "Balanced", "Aggressive"] as const;

type Props = {
  propertyId: string;
  listPriceCents: number;
  caseId?: string | null;
  /** Case command center snapshot — grounds future-outcome steps in live file state. */
  caseHealthSnapshot?: CaseHealthSnapshot | null;
  restoreNonce?: number;
  restoredInput?: OfferScenarioInput | null;
  onSavedToHistory?: () => void;
};

export function OfferStrategySimulator({
  propertyId,
  listPriceCents,
  caseId,
  caseHealthSnapshot = null,
  restoreNonce = 0,
  restoredInput,
  onSavedToHistory,
}: Props) {
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [draft, setDraft] = useState<OfferDraft>(() => defaultOfferDraft());
  const [drafts, setDrafts] = useState<[OfferDraft, OfferDraft, OfferDraft]>(() => compareDraftDefaults());

  const [singleResult, setSingleResult] = useState<OfferSimulationResult | null>(null);
  const [compareResult, setCompareResult] = useState<ScenarioComparisonResult | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveLabel, setSaveLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const presentationMode = useOfferStrategyPresentationMode(propertyId);
  const isPresentation = presentationMode === "client_presentation_mode";

  const compareInputs = useMemo(
    () =>
      [
        draftToInput(propertyId, listPriceCents, drafts[0]),
        draftToInput(propertyId, listPriceCents, drafts[1]),
        draftToInput(propertyId, listPriceCents, drafts[2]),
      ] as [OfferScenarioInput, OfferScenarioInput, OfferScenarioInput],
    [drafts, listPriceCents, propertyId],
  );

  const singleInput = useMemo(() => draftToInput(propertyId, listPriceCents, draft), [draft, listPriceCents, propertyId]);

  useEffect(() => {
    fetch(`/api/offer-strategy/recommended/${encodeURIComponent(propertyId)}`).catch(() => undefined);
  }, [propertyId]);

  useEffect(() => {
    if (restoredInput == null) return;
    setDraft(inputToDraft(restoredInput, listPriceCents));
    setSingleResult(null);
    setError(null);
    setMode("single");
  }, [restoreNonce, restoredInput, listPriceCents]);

  const negotiationSeedDoneRef = useRef(false);
  useEffect(() => {
    negotiationSeedDoneRef.current = false;
  }, [propertyId, caseId]);

  useEffect(() => {
    if (!caseId || restoredInput != null || negotiationSeedDoneRef.current || listPriceCents <= 0) return;
    let cancelled = false;
    fetch(`/api/negotiation-chains?propertyId=${encodeURIComponent(propertyId)}&caseId=${encodeURIComponent(caseId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        negotiationSeedDoneRef.current = true;
        const av = j.activeVersion as { terms?: { priceCents: number; depositCents: number | null } } | null;
        if (!av?.terms) return;
        const priceCents = av.terms.priceCents;
        const ratio = priceCents / Math.max(1, listPriceCents);
        const dep = av.terms.depositCents;
        const offerPrice = Math.max(1, priceCents);
        const depRatio = dep == null ? null : dep / offerPrice;
        setDraft((d) => ({
          ...d,
          offerRatio: Math.min(1.08, Math.max(0.85, ratio)),
          depositRatio: depRatio,
        }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [caseId, propertyId, listPriceCents, restoredInput]);

  const saveToHistory = useCallback(async () => {
    if (!caseId || !singleResult) return;
    const label = saveLabel.trim() || `Scenario ${new Date().toISOString().slice(0, 16)}`;
    setSaving(true);
    setError(null);
    try {
      const input = draftToInput(propertyId, listPriceCents, draft);
      const res = await fetch("/api/offer-strategy/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          caseId,
          scenarioLabel: label,
          input,
          output: singleResult,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Could not save scenario.");
        return;
      }
      setSaveLabel("");
      posthog?.capture("offer_strategy_scenario_saved", { propertyId, caseId });
      onSavedToHistory?.();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }, [caseId, draft, listPriceCents, onSavedToHistory, propertyId, saveLabel, singleResult]);

  const runSingle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const input = draftToInput(propertyId, listPriceCents, draft);
      const res = await fetch("/api/offer-strategy/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Simulation failed.");
        setSingleResult(null);
        return;
      }
      setSingleResult(j.result as OfferSimulationResult);
      posthog?.capture("offer_strategy_simulated", { propertyId, mode: "single" });
    } catch {
      setError("Network error.");
      setSingleResult(null);
    } finally {
      setLoading(false);
    }
  }, [draft, listPriceCents, propertyId]);

  const runCompare = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const scenarios = [
        { id: "a", label: COMPARE_LABELS[0], input: draftToInput(propertyId, listPriceCents, drafts[0]) },
        { id: "b", label: COMPARE_LABELS[1], input: draftToInput(propertyId, listPriceCents, drafts[1]) },
        { id: "c", label: COMPARE_LABELS[2], input: draftToInput(propertyId, listPriceCents, drafts[2]) },
      ] as const;
      const res = await fetch("/api/offer-strategy/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, scenarios }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Comparison failed.");
        setCompareResult(null);
        return;
      }
      setCompareResult(j.result as ScenarioComparisonResult);
      setSelectedScenarioId(j.result.bestRiskAdjustedScenarioId as string);
      posthog?.capture("offer_strategy_compared", { propertyId });
    } catch {
      setError("Network error.");
      setCompareResult(null);
    } finally {
      setLoading(false);
    }
  }, [drafts, listPriceCents, propertyId]);

  const loadRecommendedTemplate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/offer-strategy/recommended/${encodeURIComponent(propertyId)}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Could not load template.");
        return;
      }
      const input = j.input as {
        offerPriceCents: number;
        depositAmountCents: number | null;
        financingCondition: boolean;
        inspectionCondition: boolean;
        documentReviewCondition: boolean;
        occupancyDate: string | null;
        signatureDate: string | null;
        userStrategyMode: string | null;
      };
      setDraft({
        offerRatio: input.offerPriceCents / Math.max(1, listPriceCents),
        depositRatio:
          input.depositAmountCents == null ? null : input.depositAmountCents / Math.max(1, input.offerPriceCents),
        financingCondition: input.financingCondition,
        inspectionCondition: input.inspectionCondition,
        documentReviewCondition: input.documentReviewCondition,
        occupancyDate: input.occupancyDate,
        signatureDate: input.signatureDate,
        userStrategyMode: input.userStrategyMode,
      });
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [listPriceCents, propertyId]);

  const resetSingle = useCallback(() => {
    setDraft(defaultOfferDraft());
    setSingleResult(null);
    setError(null);
  }, []);

  const resetCompare = useCallback(() => {
    setDrafts(compareDraftDefaults());
    setCompareResult(null);
    setSelectedScenarioId(null);
    setError(null);
  }, []);

  if (!isDealAnalyzerOfferAssistantEnabled()) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">Offer strategy simulator</p>
        <p className="mt-1 text-xs text-slate-500">
          {isPresentation
            ? "Simple illustration for your conversation — not legal advice, not a guarantee about price or acceptance."
            : ADVISORY_ONLY_NOTICE}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("single");
            setError(null);
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            mode === "single" ? "bg-premium-gold text-black" : "border border-white/15 bg-[#121212] text-slate-300"
          }`}
        >
          Single scenario
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("compare");
            setError(null);
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            mode === "compare" ? "bg-premium-gold text-black" : "border border-white/15 bg-[#121212] text-slate-300"
          }`}
        >
          Compare A / B / C
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-100">{error}</p>
      ) : null}

      {mode === "single" ? (
        <>
          <OfferScenarioInputs
            listPriceCents={listPriceCents}
            draft={draft}
            onChange={setDraft}
            idPrefix="oss"
            presentationMode={isPresentation}
          />
          {isPresentation ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled={loading}
                onClick={runSingle}
                className="w-full rounded-xl bg-premium-gold py-3.5 text-base font-semibold text-black shadow-md shadow-black/25 transition hover:bg-[#ddb84d] disabled:opacity-50"
              >
                {loading ? "Updating…" : "See how this scenario looks"}
              </button>
              <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
                <button type="button" onClick={resetSingle} className="underline decoration-white/20 underline-offset-2 hover:text-slate-300">
                  Start over
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={loadRecommendedTemplate}
                  className="underline decoration-white/20 underline-offset-2 hover:text-slate-300 disabled:opacity-50"
                >
                  Use suggested starting point
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={runSingle}
                className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {loading ? "Running…" : "Run simulation"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={loadRecommendedTemplate}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 disabled:opacity-50"
              >
                Load recommended template
              </button>
              <button
                type="button"
                onClick={resetSingle}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400"
              >
                Reset
              </button>
            </div>
          )}
          {caseId && singleResult && !isPresentation ? (
            <div className="rounded-xl border border-white/10 bg-[#121212] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Save to case history</p>
              <p className="mt-1 text-xs text-slate-500">
                Stores a deterministic snapshot of inputs and results for this case — audit only, not a binding offer.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  type="text"
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                  placeholder="Label (optional)"
                  className="min-w-[180px] flex-1 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder:text-slate-600"
                />
                <button
                  type="button"
                  disabled={saving || loading}
                  onClick={saveToHistory}
                  className="rounded-lg border border-premium-gold/50 bg-premium-gold/10 px-4 py-2 text-sm font-medium text-premium-gold disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save snapshot"}
                </button>
              </div>
            </div>
          ) : null}
          {singleResult && isPresentation ? (
            <>
              <OfferScenarioPresentationView
                result={singleResult}
                offerPriceCents={singleInput.offerPriceCents}
                depositAmountCents={singleInput.depositAmountCents}
                occupancyDate={singleInput.occupancyDate}
                signatureDate={singleInput.signatureDate}
                listPriceCents={listPriceCents}
              />
              <FutureOutcomePanel
                propertyId={propertyId}
                listPriceCents={listPriceCents}
                scenarioInput={singleInput}
                simulationResult={singleResult}
                caseHealthSnapshot={caseHealthSnapshot}
                presentationMode
              />
            </>
          ) : null}
          {singleResult && !isPresentation ? (
            <div className="space-y-4 border-t border-white/10 pt-4">
              <OfferScenarioResults result={singleResult} />
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-500/90">Warnings</p>
                  <OfferScenarioWarnings warnings={singleResult.keyWarnings} />
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Protections (illustrative)</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                      {singleResult.recommendedProtections.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Next actions (review)</p>
                    <OfferScenarioNextActions actions={singleResult.nextActions} />
                  </div>
                </div>
              </div>
              <FutureOutcomePanel
                propertyId={propertyId}
                listPriceCents={listPriceCents}
                scenarioInput={singleInput}
                simulationResult={singleResult}
                caseHealthSnapshot={caseHealthSnapshot}
              />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            {COMPARE_LABELS.map((label, idx) => (
              <div key={label} className="rounded-xl border border-white/10 bg-[#121212]/80 p-3">
                <p className="mb-3 text-xs font-semibold text-premium-gold">{label}</p>
                <OfferScenarioInputs
                  listPriceCents={listPriceCents}
                  draft={drafts[idx]!}
                  onChange={(next) => {
                    setDrafts((d) => {
                      const copy: [OfferDraft, OfferDraft, OfferDraft] = [...d];
                      copy[idx] = next;
                      return copy;
                    });
                  }}
                  idPrefix={`osc-${idx}`}
                  presentationMode={isPresentation}
                />
              </div>
            ))}
          </div>
          {isPresentation ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled={loading}
                onClick={runCompare}
                className="w-full rounded-xl bg-premium-gold py-3.5 text-base font-semibold text-black shadow-md shadow-black/25 transition hover:bg-[#ddb84d] disabled:opacity-50"
              >
                {loading ? "Comparing…" : "Compare these three side by side"}
              </button>
              <p className="text-center">
                <button type="button" onClick={resetCompare} className="text-xs text-slate-500 underline decoration-white/20 underline-offset-2 hover:text-slate-300">
                  Clear comparison
                </button>
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={runCompare}
                className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {loading ? "Comparing…" : "Compare scenarios"}
              </button>
              <button type="button" onClick={resetCompare} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400">
                Reset
              </button>
            </div>
          )}
          {compareResult ? (
            <div className="border-t border-white/10 pt-4">
              <OfferScenarioComparison
                propertyId={propertyId}
                comparison={compareResult}
                selectedId={selectedScenarioId}
                onSelect={setSelectedScenarioId}
                presentationMode={isPresentation}
                listPriceCents={listPriceCents}
                compareInputs={compareInputs}
              />
              {selectedScenarioId ? (() => {
                const scen = compareResult.scenarios.find((s) => s.id === selectedScenarioId);
                const idx = compareResult.scenarios.findIndex((s) => s.id === selectedScenarioId);
                if (!scen || idx < 0 || idx > 2) return null;
                const inp = compareInputs[idx];
                return (
                  <div className="mt-6">
                    <FutureOutcomePanel
                      propertyId={propertyId}
                      listPriceCents={listPriceCents}
                      scenarioInput={inp}
                      simulationResult={scen.result}
                      caseHealthSnapshot={caseHealthSnapshot}
                      presentationMode={isPresentation}
                    />
                  </div>
                );
              })() : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
