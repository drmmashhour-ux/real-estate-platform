"use client";

import { useEffect, useState } from "react";
import type { LegalFraudEngineSummary, LegalFraudOperationalIndicator, LegalFraudReviewSignal } from "@/modules/legal/legal-fraud-engine.service";
import { LegalFraudEngineSummaryCard } from "./LegalFraudEngineSummaryCard";
import { LegalFraudIndicatorsTable } from "./LegalFraudIndicatorsTable";
import { LegalFraudReviewSignalsCard } from "./LegalFraudReviewSignalsCard";

export function LegalFraudEnginePanel() {
  const [summary, setSummary] = useState<LegalFraudEngineSummary | null>(null);
  const [indicators, setIndicators] = useState<LegalFraudOperationalIndicator[]>([]);
  const [reviewSignals, setReviewSignals] = useState<LegalFraudReviewSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/admin/legal/fraud`, { credentials: "same-origin" })
      .then((r) => r.json() as Promise<Record<string, unknown>>)
      .then((body) => {
        if (cancelled) return;
        setSummary((body.summary as LegalFraudEngineSummary | null) ?? null);
        setIndicators(Array.isArray(body.indicators) ? (body.indicators as LegalFraudOperationalIndicator[]) : []);
        setReviewSignals(
          Array.isArray(body.reviewSignals) ? (body.reviewSignals as LegalFraudReviewSignal[]) : [],
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-xs text-zinc-500">Loading legal anomaly indicators…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Legal anomaly & verification indicators</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Operational review posture only — not fraud adjudication.
        </p>
      </div>
      <LegalFraudEngineSummaryCard summary={summary} />
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Indicators</h3>
        <LegalFraudIndicatorsTable indicators={indicators} />
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Review signals</h3>
        <LegalFraudReviewSignalsCard signals={reviewSignals} />
      </div>
      <p className="text-[10px] text-zinc-600">
        Scoped views: append <span className="font-mono">?entityType=fsbo_listing&entityId=&lt;id&gt;</span> to the API
        (UI uses aggregate by default).
      </p>
    </div>
  );
}
