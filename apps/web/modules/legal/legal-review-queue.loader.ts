import { prisma } from "@/lib/db";
import { legalIntelligenceFlags } from "@/config/feature-flags";
import type { LegalReviewQueueItemInput } from "./legal-intelligence.types";
import { getLegalIntelligenceBundle } from "./legal-intelligence.service";

export async function loadLegalReviewQueueItems(limit: number): Promise<LegalReviewQueueItemInput[]> {
  const take = Math.min(Math.max(limit, 1), 100);
  try {
    const [pendingSlots, pendingSupporting] = await Promise.all([
      prisma.fsboListingDocument.findMany({
        where: { status: "pending_review" },
        orderBy: { updatedAt: "asc" },
        take,
        select: {
          id: true,
          fsboListingId: true,
          docType: true,
          updatedAt: true,
        },
      }),
      prisma.sellerSupportingDocument.findMany({
        where: { status: "PENDING" },
        orderBy: { updatedAt: "asc" },
        take,
        select: {
          id: true,
          fsboListingId: true,
          category: true,
          updatedAt: true,
        },
      }),
    ]);

    const listingIds = [
      ...new Set([...pendingSlots.map((s) => s.fsboListingId), ...pendingSupporting.map((s) => s.fsboListingId)]),
    ].slice(0, 40);

    const bundles =
      legalIntelligenceFlags.legalIntelligenceV1 && listingIds.length > 0
        ? await Promise.all(
            listingIds.map((entityId) =>
              getLegalIntelligenceBundle({
                entityType: "fsbo_listing",
                entityId,
                actorType: "seller",
                workflowType: "fsbo_seller_documents",
              }).catch(() => null),
            ),
          )
        : [];
    const bundleByListing = new Map<string, NonNullable<(typeof bundles)[number]>>();
    listingIds.forEach((id, i) => {
      const b = bundles[i];
      if (b) bundleByListing.set(id, b);
    });

    const items: LegalReviewQueueItemInput[] = [];

    for (const s of pendingSlots) {
      const b = bundleByListing.get(s.fsboListingId);
      items.push({
        id: `slot:${s.id}`,
        entityType: "fsbo_listing",
        entityId: s.fsboListingId,
        workflowType: "fsbo_slot_document",
        submittedAt: s.updatedAt.toISOString(),
        label: `Slot review · ${s.docType}`,
        workflowSensitivity: "high",
        criticalSignals: b?.summary.countsBySeverity.critical,
        warningSignals: b?.summary.countsBySeverity.warning,
      });
    }

    for (const s of pendingSupporting) {
      const b = bundleByListing.get(s.fsboListingId);
      items.push({
        id: `support:${s.id}`,
        entityType: "fsbo_listing",
        entityId: s.fsboListingId,
        workflowType: "seller_supporting_document",
        submittedAt: s.updatedAt.toISOString(),
        label: `Supporting · ${s.category}`,
        workflowSensitivity: "medium",
        criticalSignals: b?.summary.countsBySeverity.critical,
        warningSignals: b?.summary.countsBySeverity.warning,
      });
    }

    const seen = new Set<string>();
    const deduped = items.filter((x) => {
      const k = `${x.entityType}:${x.entityId}:${x.id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return deduped.slice(0, take);
  } catch {
    return [];
  }
}
