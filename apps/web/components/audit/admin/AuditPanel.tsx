"use client";

import { useEffect, useState } from "react";
import type { AuditPanelPayload } from "@/modules/audit/audit-panel.service";
import { AuditPanelSummaryCard } from "./AuditPanelSummaryCard";
import { AuditTimelineTable } from "./AuditTimelineTable";
import { AuditRiskSummaryCard } from "./AuditRiskSummaryCard";
import { AuditReasonTrailCard } from "./AuditReasonTrailCard";
import { AuditPreviewReasoningCard } from "./AuditPreviewReasoningCard";

const GOLD = "#D4AF37";

export function AuditPanel({
  scopeType,
  listingId,
  entityType,
  entityId,
}: {
  scopeType: "listing" | "legal_entity";
  listingId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}) {
  const [panel, setPanel] = useState<AuditPanelPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [localListingId, setLocalListingId] = useState(listingId ?? "");

  const effectiveListingId = (listingId?.trim() || localListingId.trim()) || "";

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ scopeType });
    if (scopeType === "listing" && effectiveListingId) {
      params.set("listingId", effectiveListingId);
    }
    if (scopeType === "legal_entity" && entityType?.trim() && entityId?.trim()) {
      params.set("entityType", entityType.trim());
      params.set("entityId", entityId.trim());
    }

    const run =
      scopeType === "listing" ?
        !!effectiveListingId
      : !!(entityType?.trim() && entityId?.trim());

    if (!run) {
      setPanel(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    void fetch(`/api/admin/audit?${params.toString()}`, { credentials: "same-origin" })
      .then((r) => r.json() as Promise<{ panel?: AuditPanelPayload | null }>)
      .then((body) => {
        if (!cancelled) setPanel(body.panel ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [scopeType, effectiveListingId, entityType, entityId]);

  return (
    <div className="space-y-4">
      {scopeType === "listing" ? (
        <div className="flex flex-wrap gap-2">
          <input
            value={localListingId}
            onChange={(e) => setLocalListingId(e.target.value)}
            placeholder="FSBO listing id"
            className="min-w-[220px] rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs text-zinc-200"
          />
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-xs font-semibold text-black"
            style={{ backgroundColor: GOLD }}
            onClick={() => setLocalListingId((s) => s.trim())}
          >
            Refresh
          </button>
        </div>
      ) : null}

      {loading ? <p className="text-xs text-zinc-500">Loading audit panel…</p> : null}

      <AuditPanelSummaryCard panel={panel} />
      <AuditPreviewReasoningCard text={panel?.previewReasoningSummary} />
      <AuditRiskSummaryCard summary={panel?.riskAnomalySummary ?? "—"} />
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Reason trail</h3>
        <AuditReasonTrailCard trail={panel?.reasonTrail ?? []} />
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Timeline</h3>
        <AuditTimelineTable rows={panel?.timeline ?? []} />
      </div>
    </div>
  );
}

