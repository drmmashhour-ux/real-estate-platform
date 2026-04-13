import {
  AdminAiEntityType,
  AdminAiInsightPriority,
  AdminAiInsightType,
} from "@prisma/client";
import type { AdminAiInsightPayload, PlatformSignals } from "./types";

export async function generateListingDiagnoses(
  signals: PlatformSignals,
  runId: string
): Promise<AdminAiInsightPayload[]> {
  const out: AdminAiInsightPayload[] = [];

  for (const row of signals.listings.highTrafficLowConversion.slice(0, 8)) {
    const issues: string[] = [];
    if (row.views >= 50 && row.contacts <= 1) {
      issues.push("High views with almost no contact clicks — check hero image, price clarity, and trust badges.");
    }
    if ((row.demandScore ?? 0) >= 60 && row.contacts <= 2) {
      issues.push("Demand score is elevated but engagement is low — verify CTA placement and contact friction.");
    }
    if (issues.length === 0) {
      issues.push("Traffic/conversion imbalance detected in analytics — manual review recommended.");
    }
    out.push({
      type: AdminAiInsightType.listing_diagnosis,
      title: `Listing diagnosis · ${row.kind} ${row.listingId.slice(0, 8)}…`,
      body: issues.join(" "),
      priority: AdminAiInsightPriority.medium,
      entityType: AdminAiEntityType.listing,
      entityId: row.listingId,
      metadataJson: {
        runId,
        kind: row.kind,
        views: row.views,
        contacts: row.contacts,
        demandScore: row.demandScore,
        href:
          row.kind === "FSBO"
            ? `/admin/fsbo/${row.listingId}`
            : row.kind === "CRM"
              ? `/admin/listings`
              : `/admin/listings/stays`,
      },
    });
  }

  for (const w of signals.listings.weakDescriptions) {
    out.push({
      type: AdminAiInsightType.listing_diagnosis,
      title: `Weak description · ${w.title ?? w.id.slice(0, 8)}`,
      body: `Description length ${w.charCount} characters. Expand with condition, inclusions, and neighborhood context (signals-only).`,
      priority: AdminAiInsightPriority.low,
      entityType: AdminAiEntityType.listing,
      entityId: w.id,
      metadataJson: { runId, href: `/admin/fsbo/${w.id}`, charCount: w.charCount },
    });
  }

  return out;
}
