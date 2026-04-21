"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

const OBJECTIVES = [
  "BALANCED",
  "RISK_REDUCTION",
  "CASHFLOW_STABILITY",
  "ESG_ADVANCEMENT",
  "COMPLIANCE_CLEANUP",
  "CAPITAL_EFFICIENCY",
] as const;

export function PortfolioIntelligenceClient() {
  const [objectiveMode, setObjectiveMode] = useState<(typeof OBJECTIVES)[number]>("BALANCED");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/portfolio/intelligence/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectiveMode }),
      });
      const json = await res.json().catch(() => ({}));
      setResult(json as Record<string, unknown>);
    } finally {
      setBusy(false);
    }
  }, [objectiveMode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Objective mode
          <select
            className="ml-2 rounded-md border bg-background px-2 py-1 text-sm"
            value={objectiveMode}
            onChange={(e) => setObjectiveMode(e.target.value as (typeof OBJECTIVES)[number])}
          >
            {OBJECTIVES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" disabled={busy} onClick={() => void run()}>
          {busy ? "Running…" : "Run optimization"}
        </Button>
      </div>

      {result ? (
        <pre className="max-h-[480px] overflow-auto rounded-xl border bg-muted/40 p-4 text-xs">{JSON.stringify(result, null, 2)}</pre>
      ) : (
        <p className="text-sm text-muted-foreground">Run produces an audit row plus proposed priorities and capital snapshot.</p>
      )}
    </div>
  );
}
