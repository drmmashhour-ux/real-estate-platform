import { CROSS_ENTITY_FILENAME_MIN_LISTINGS } from "../legal-intelligence.constants";
import type { LegalIntelligenceSignal } from "../legal-intelligence.types";
import type { LegalDetector } from "./legal-detector.types";
import { normalizeFileKey, stableSignalId } from "./legal-detector-utils";

export const crossEntityConflictDetector: LegalDetector = {
  id: "cross_entity_conflict",
  run(snapshot): LegalIntelligenceSignal[] {
    const out: LegalIntelligenceSignal[] = [];
    const listingId = snapshot.fsboListingId ?? snapshot.entityId;
    const groups = new Map<string, Set<string>>();
    const consider = [...snapshot.supportingDocuments, ...snapshot.supportingDocumentsSameUserOtherListings];
    for (const d of consider) {
      const key = `${normalizeFileKey(d.originalFileName)}::${d.mimeType}`;
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key)!.add(d.fsboListingId);
    }
    for (const [key, set] of groups.entries()) {
      if (set.size < CROSS_ENTITY_FILENAME_MIN_LISTINGS) continue;
      out.push({
        id: stableSignalId(["cross_entity_conflict", listingId, key]),
        signalType: "cross_entity_conflict",
        severity: "warning",
        entityType: snapshot.entityType || "legal_workflow",
        entityId: listingId,
        actorType: snapshot.actorType || "unknown",
        workflowType: snapshot.workflowType || "unknown",
        observedAt: snapshot.builtAt,
        explanation:
          "Metadata reuse pattern: the same displayed filename/MIME pair appears across multiple listing contexts for this account — verify correct asset association.",
        metadata: {
          distinctListings: set.size,
          keySuffix: key.slice(0, 120),
        },
      });
    }
    return out;
  },
};
