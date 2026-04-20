"use client";

import { useEffect, useState } from "react";
import { LegalIntelligenceSignalsTable } from "./LegalIntelligenceSignalsTable";
import { LegalIntelligenceSummaryCard } from "./LegalIntelligenceSummaryCard";
import { LegalReviewPriorityTable } from "./LegalReviewPriorityTable";
import { LegalRiskEscalationCard } from "./LegalRiskEscalationCard";
import { EventTimeline } from "./EventTimeline";
import type { LegalIntelligenceSignal } from "@/modules/legal/legal-intelligence.types";
import type { LegalIntelligenceSummary } from "@/modules/legal/legal-intelligence.types";
import type { LegalQueueItemScore } from "@/modules/legal/legal-intelligence.types";
import type { LegalEscalationAdvice } from "@/modules/legal/legal-escalation.service";

type IntelPayload = {
  summary: LegalIntelligenceSummary | null;
  signals: LegalIntelligenceSignal[];
  flags?: { legalIntelligenceV1?: boolean; scoped?: boolean };
  freshness?: { generatedAt?: string };
};

type QueuePayload = {
  prioritized: LegalQueueItemScore[];
  summary: { rawCount?: number; prioritizedCount?: number } | null;
  escalation: LegalEscalationAdvice | null;
  flags?: { legalReviewPriorityV1?: boolean };
  freshness?: { generatedAt?: string };
};

export function LegalIntelligenceAdminSection({ listingId }: { listingId?: string | null }) {
  const [intel, setIntel] = useState<IntelPayload | null>(null);
  const [queue, setQueue] = useState<QueuePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const intelUrl = listingId
      ? `/api/admin/legal/intelligence?entityType=fsbo_listing&entityId=${encodeURIComponent(listingId)}`
      : `/api/admin/legal/intelligence`;

    void Promise.all([
      fetch(intelUrl, { credentials: "same-origin" }).then((r) => r.json() as Promise<IntelPayload>),
      fetch(`/api/admin/legal/review-priority?limit=40`, { credentials: "same-origin" }).then(
        (r) => r.json() as Promise<QueuePayload>,
      ),
    ])
      .then(([i, q]) => {
        if (cancelled) return;
        setIntel(i);
        setQueue(q);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (loading) {
    return <p className="text-xs text-slate-500">Loading legal intelligence panels…</p>;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Legal intelligence</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <LegalIntelligenceSummaryCard summary={intel?.summary ?? null} />
          <LegalRiskEscalationCard advice={queue?.escalation ?? null} />
        </div>
        <p className="text-[10px] text-slate-600">
          Last refresh: {intel?.freshness?.generatedAt ?? "—"} · Scoped:{" "}
          {intel?.flags?.scoped === false ? "platform aggregate" : listingId ?? "listing"}
        </p>
        <LegalIntelligenceSignalsTable signals={Array.isArray(intel?.signals) ? intel!.signals : []} />
        {listingId ? (
          <EventTimeline entityType="listing" entityId={listingId} title="Listing event timeline" />
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Prioritized review queue</h2>
        <p className="text-[11px] text-slate-500">
          Deterministic ordering for operations — does not assign reviewers automatically.
        </p>
        <LegalReviewPriorityTable prioritized={Array.isArray(queue?.prioritized) ? queue!.prioritized : []} />
        <p className="text-[10px] text-slate-600">Queue refresh: {queue?.freshness?.generatedAt ?? "—"}</p>
      </section>
    </div>
  );
}
