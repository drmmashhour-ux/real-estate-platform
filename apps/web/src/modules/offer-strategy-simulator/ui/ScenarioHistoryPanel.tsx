"use client";

import { useCallback, useEffect, useState } from "react";
import { posthog } from "@/components/analytics/PostHogClient";
import type { OfferScenarioInput } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import type { SavedOfferScenarioDto, SavedScenariosComparisonView } from "@/src/modules/offer-strategy-simulator/domain/savedScenario.types";
import { ScenarioHistoryItem } from "@/src/modules/offer-strategy-simulator/ui/ScenarioHistoryItem";
import { SavedScenarioComparison } from "@/src/modules/offer-strategy-simulator/ui/SavedScenarioComparison";

type Props = {
  propertyId: string;
  caseId: string;
  refreshKey: number;
  onRestore: (input: OfferScenarioInput) => void;
};

export function ScenarioHistoryPanel({ propertyId, caseId, refreshKey, onRestore }: Props) {
  const [items, setItems] = useState<SavedOfferScenarioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [comparison, setComparison] = useState<SavedScenariosComparisonView | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/offer-strategy/scenarios?propertyId=${encodeURIComponent(propertyId)}&caseId=${encodeURIComponent(caseId)}`,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Could not load history.");
        setItems([]);
        return;
      }
      setItems(Array.isArray(j.scenarios) ? j.scenarios : []);
    } catch {
      setError("Network error.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [caseId, propertyId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const toggleCompare = useCallback((id: string) => {
    setCompareSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= 2 && !next.has(id)) return prev;
        next.add(id);
      }
      return next;
    });
  }, []);

  const runCompare = useCallback(async () => {
    const ids = [...compareSet];
    if (ids.length !== 2) return;
    setBusyId("compare");
    setError(null);
    try {
      const res = await fetch("/api/offer-strategy/scenarios/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, idA: ids[0], idB: ids[1] }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Comparison failed.");
        return;
      }
      setComparison(j.comparison as SavedScenariosComparisonView);
    } catch {
      setError("Network error.");
    } finally {
      setBusyId(null);
    }
  }, [compareSet, propertyId]);

  const selectPreferred = useCallback(
    async (scenarioId: string) => {
      setBusyId(scenarioId);
      setError(null);
      try {
        const res = await fetch(`/api/offer-strategy/scenarios/${encodeURIComponent(scenarioId)}/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId, caseId }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof j.error === "string" ? j.error : "Could not update selection.");
          return;
        }
        await load();
      } catch {
        setError("Network error.");
      } finally {
        setBusyId(null);
      }
    },
    [caseId, load, propertyId],
  );

  const restore = useCallback(
    (scenario: SavedOfferScenarioDto) => {
      onRestore(scenario.input);
      posthog?.capture("offer_strategy_scenario_restored", { propertyId, caseId, scenarioId: scenario.id });
    },
    [caseId, onRestore, propertyId],
  );

  const remove = useCallback(
    async (scenarioId: string) => {
      setBusyId(scenarioId);
      setError(null);
      try {
        const res = await fetch(
          `/api/offer-strategy/scenarios/${encodeURIComponent(scenarioId)}?propertyId=${encodeURIComponent(propertyId)}`,
          { method: "DELETE" },
        );
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof j.error === "string" ? j.error : "Delete failed.");
          return;
        }
        setCompareSet((s) => {
          const n = new Set(s);
          n.delete(scenarioId);
          return n;
        });
        await load();
      } catch {
        setError("Network error.");
      } finally {
        setBusyId(null);
      }
    },
    [load, propertyId],
  );

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0B0B0B]/90 p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">Scenario history</p>
          <p className="mt-1 text-xs text-slate-500">
            Deterministic snapshots for this case — for review and audit. Not a binding offer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={compareSet.size !== 2 || busyId === "compare"}
            onClick={runCompare}
            className="rounded-lg border border-premium-gold/40 px-3 py-1.5 text-xs font-medium text-premium-gold disabled:opacity-40"
          >
            {busyId === "compare" ? "Comparing…" : "Compare selected"}
          </button>
          <button type="button" onClick={load} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400">
            Refresh
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {loading ? <p className="text-sm text-slate-500">Loading saved scenarios…</p> : null}

      {!loading && items.length === 0 ? (
        <p className="text-sm text-slate-500">No saved scenarios yet. Run a simulation and save a snapshot.</p>
      ) : null}

      <div className="space-y-2">
        {items.map((s) => (
          <ScenarioHistoryItem
            key={s.id}
            scenario={s}
            compareSelected={compareSet.has(s.id)}
            onToggleCompare={() => toggleCompare(s.id)}
            onSelectPreferred={() => selectPreferred(s.id)}
            onRestore={() => restore(s)}
            onDelete={() => remove(s.id)}
            busy={busyId === s.id || busyId === "compare"}
          />
        ))}
      </div>

      {comparison ? (
        <SavedScenarioComparison comparison={comparison} onClose={() => setComparison(null)} />
      ) : null}
    </div>
  );
}
