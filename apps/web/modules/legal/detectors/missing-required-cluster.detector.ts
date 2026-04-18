import { MISSING_CLUSTER_MIN_MISSING } from "../legal-intelligence.constants";
import type { LegalIntelligenceSignal } from "../legal-intelligence.types";
import type { LegalDetector } from "./legal-detector.types";
import { stableSignalId } from "./legal-detector-utils";

export const missingRequiredClusterDetector: LegalDetector = {
  id: "missing_required_cluster",
  run(snapshot): LegalIntelligenceSignal[] {
    const out: LegalIntelligenceSignal[] = [];
    const listingId = snapshot.fsboListingId ?? snapshot.entityId;
    const criticalTypes = ["ownership", "id_proof"];
    let missingCritical = 0;
    for (const d of snapshot.documents) {
      if (!criticalTypes.includes(d.docType)) continue;
      if (d.status === "missing" || d.status === "") missingCritical += 1;
    }
    if (
      snapshot.aggregates.slotMissingCriticalCount >= MISSING_CLUSTER_MIN_MISSING ||
      missingCritical >= MISSING_CLUSTER_MIN_MISSING
    ) {
      out.push({
        id: stableSignalId(["missing_required_cluster", listingId]),
        signalType: "missing_required_cluster",
        severity: snapshot.aggregates.slotPendingReviewCount > 0 ? "warning" : "info",
        entityType: snapshot.entityType || "legal_workflow",
        entityId: listingId,
        actorType: snapshot.actorType || "unknown",
        workflowType: snapshot.workflowType || "unknown",
        observedAt: snapshot.builtAt,
        explanation:
          "Completeness signal: multiple critical document slots are not satisfied — downstream publishing or verification gates may remain blocked.",
        metadata: {
          missingCriticalSlotsApprox: Math.max(missingCritical, snapshot.aggregates.slotMissingCriticalCount),
        },
      });
    }
    return out;
  },
};
