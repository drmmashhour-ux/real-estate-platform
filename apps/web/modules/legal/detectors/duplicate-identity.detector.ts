import { DUPLICATE_IDENTITY_MIN_CASES } from "../legal-intelligence.constants";
import type { LegalIntelligenceSignal } from "../legal-intelligence.types";
import type { LegalDetector } from "./legal-detector.types";
import { stableSignalId } from "./legal-detector-utils";

export const duplicateIdentityDetector: LegalDetector = {
  id: "duplicate_identity",
  run(snapshot): LegalIntelligenceSignal[] {
    const out: LegalIntelligenceSignal[] = [];
    const listingId = snapshot.fsboListingId ?? snapshot.entityId;
    const openish = snapshot.verificationCases.filter(
      (c) =>
        (c.status === "pending" || c.status === "in_review" || c.status === "needs_info") &&
        c.identitySignalCount > 0,
    );
    if (openish.length < DUPLICATE_IDENTITY_MIN_CASES) return out;
    out.push({
      id: stableSignalId(["duplicate_identity", listingId, String(openish.length)]),
      signalType: "duplicate_identity",
      severity: openish.length >= DUPLICATE_IDENTITY_MIN_CASES + 1 ? "warning" : "info",
      entityType: snapshot.entityType || "legal_workflow",
      entityId: listingId,
      actorType: snapshot.actorType || "unknown",
      workflowType: snapshot.workflowType || "unknown",
      observedAt: snapshot.builtAt,
      explanation:
        "Administrative overlap: multiple open verification paths include identity-category signals — coordinate review workload; does not imply identity misuse.",
      metadata: {
        openCasesWithIdentitySignals: openish.length,
      },
    });
    return out;
  },
};
