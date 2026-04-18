import type { LegalIntelligenceSignal } from "../legal-intelligence.types";
import type { LegalDetector } from "./legal-detector.types";
import { stableSignalId } from "./legal-detector-utils";

function sellerScopedWorkflow(workflowType: string): boolean {
  const w = workflowType.toLowerCase();
  return (
    w.includes("fsbo_seller") ||
    w.includes("seller_documents") ||
    w.includes("seller_declaration") ||
    w.includes("private_seller_upload")
  );
}

export const mismatchedActorWorkflowDetector: LegalDetector = {
  id: "mismatched_actor_workflow",
  run(snapshot): LegalIntelligenceSignal[] {
    const out: LegalIntelligenceSignal[] = [];
    const listingId = snapshot.fsboListingId ?? snapshot.entityId;
    if (!sellerScopedWorkflow(snapshot.workflowType)) return out;

    const actor = snapshot.actorType.toLowerCase();
    const incompatible =
      actor !== "seller" &&
      actor !== "admin" &&
      actor !== "operator" &&
      !(actor === "broker" && snapshot.listingOwnerType === "BROKER");

    if (!incompatible) return out;

    out.push({
      id: stableSignalId(["mismatched_actor_workflow", listingId, actor]),
      signalType: "mismatched_actor_workflow",
      severity: "warning",
      entityType: snapshot.entityType || "legal_workflow",
      entityId: listingId,
      actorType: snapshot.actorType || "unknown",
      workflowType: snapshot.workflowType || "unknown",
      observedAt: snapshot.builtAt,
      explanation:
        "Routing check: seller-scoped workflow label with an actor role that normally does not own FSBO seller uploads — verify delegated access and tenancy rules.",
      metadata: {
        listingOwnerType: snapshot.listingOwnerType ?? "",
      },
    });
    return out;
  },
};
