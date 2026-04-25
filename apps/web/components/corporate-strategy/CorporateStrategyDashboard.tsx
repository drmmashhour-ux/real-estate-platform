"use client";

import { useCallback, useEffect, useState } from "react";
import type { CorporateStrategyView } from "@/modules/corporate-strategy/corporate-strategy.types";
import { BottlenecksPanel } from "./BottlenecksPanel";
import { BudgetStrategyPanel } from "./BudgetStrategyPanel";
import { HiringStrategyPanel } from "./HiringStrategyPanel";
import { ProductRoadmapPanel } from "./ProductRoadmapPanel";
import { QuarterlyPlanPanel } from "./QuarterlyPlanPanel";
import { RiskPanel } from "./RiskPanel";

type Resp = { ok: boolean; strategy: CorporateStrategyView | null; featureDisabled?: boolean; message?: string; error?: string; disclaimer?: string };

export function CorporateStrategyDashboard() {
  const [s, setS] = useState<CorporateStrategyView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [disc, setDisc] = useState<string>("");
  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await fetch("/api/corporate-strategy", { credentials: "include" });
      const j = (await r.json()) as Resp;
      if (!j.ok) {
        setErr(j.error ?? "Could not load");
        return;
      }
      if (j.featureDisabled) {
        setErr(j.message ?? "Feature disabled");
        setS(null);
        return;
      }
      setS(j.strategy);
      setDisc(j.disclaimer ?? "");
    } catch {
      setErr("Network error");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  if (err) {
    return (
      <div>
        <p className="text-sm text-amber-800">{err}</p>
        <button type="button" onClick={load} className="mt-2 text-sm text-slate-600 underline">
          Retry
        </button>
      </div>
    );
  }
  if (!s) {
    return <p className="text-slate-500">Loading…</p>;
  }
  return (
    <div className="space-y-8" data-testid="corporate-strategy-dashboard">
      <p className="text-xs text-slate-500" role="note">
        {disc}
      </p>
      <section>
        <h2 className="text-sm font-semibold text-slate-800">Summary</h2>
        <p className="mt-1 text-slate-700">{s.summary.headline}</p>
        <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
          {s.summary.bullets.map((b, i) => (
            <li key={`${i}-${b.slice(0, 32)}`}>{b}</li>
          ))}
        </ul>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <HiringStrategyPanel h={s.hiring} />
        <BudgetStrategyPanel b={s.budget} />
        <ProductRoadmapPanel p={s.roadmap} />
        <QuarterlyPlanPanel q={s.quarterly} />
        <BottlenecksPanel items={s.bottlenecks} />
        <RiskPanel items={s.risks} />
      </div>
    </div>
  );
}
