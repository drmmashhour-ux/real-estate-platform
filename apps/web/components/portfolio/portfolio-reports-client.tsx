"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

export function PortfolioReportsClient() {
  const [summary, setSummary] = useState<unknown>(null);
  const [pack, setPack] = useState<unknown>(null);

  const loadSummary = useCallback(async () => {
    const res = await fetch("/api/portfolio/reports/summary", { credentials: "include" });
    setSummary(await res.json().catch(() => ({})));
  }, []);

  const generate = useCallback(async () => {
    const res = await fetch("/api/portfolio/reports/generate", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectiveMode: "BALANCED" }),
    });
    setPack(await res.json().catch(() => ({})));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={() => void loadSummary()}>
          Load summary JSON
        </Button>
        <Button type="button" variant="outline" onClick={() => void generate()}>
          Generate report pack
        </Button>
      </div>
      {summary ? (
        <div>
          <h2 className="text-sm font-medium">Summary</h2>
          <pre className="mt-2 max-h-[320px] overflow-auto rounded-xl border bg-muted/40 p-4 text-xs">
            {JSON.stringify(summary, null, 2)}
          </pre>
        </div>
      ) : null}
      {pack ? (
        <div>
          <h2 className="text-sm font-medium">Pack</h2>
          <pre className="mt-2 max-h-[320px] overflow-auto rounded-xl border bg-muted/40 p-4 text-xs">
            {JSON.stringify(pack, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
