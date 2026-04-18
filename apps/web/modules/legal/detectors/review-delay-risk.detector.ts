import {
  REVIEW_DELAY_SLOT_HOURS,
  REVIEW_DELAY_SUPPORTING_HOURS,
  REVIEW_DELAY_VERIFICATION_HOURS,
} from "../legal-intelligence.constants";
import type { LegalIntelligenceSignal } from "../legal-intelligence.types";
import type { LegalDetector } from "./legal-detector.types";
import { stableSignalId } from "./legal-detector-utils";

function hoursSince(iso: string, nowMs: number): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return (nowMs - t) / 3600000;
}

export const reviewDelayRiskDetector: LegalDetector = {
  id: "review_delay_risk",
  run(snapshot): LegalIntelligenceSignal[] {
    const out: LegalIntelligenceSignal[] = [];
    const listingId = snapshot.fsboListingId ?? snapshot.entityId;
    const nowMs = Date.parse(snapshot.builtAt);
    if (Number.isNaN(nowMs)) return out;

    for (const d of snapshot.documents) {
      if (d.status !== "pending_review") continue;
      const h = hoursSince(d.updatedAt, nowMs);
      if (h < REVIEW_DELAY_SLOT_HOURS) continue;
      out.push({
        id: stableSignalId(["review_delay_risk", "slot", d.id]),
        signalType: "review_delay_risk",
        severity: h >= REVIEW_DELAY_SLOT_HOURS * 2 ? "critical" : "warning",
        entityType: snapshot.entityType || "legal_workflow",
        entityId: listingId,
        actorType: snapshot.actorType || "unknown",
        workflowType: snapshot.workflowType || "unknown",
        observedAt: snapshot.builtAt,
        explanation:
          "Queue aging: a required slot document has remained in pending review beyond the configured SLA — consider reviewer capacity, not party fault.",
        metadata: {
          docType: d.docType,
          hoursOpenRounded: Math.round(h),
          slaHours: REVIEW_DELAY_SLOT_HOURS,
        },
      });
    }

    for (const d of snapshot.supportingDocuments) {
      if (d.status !== "PENDING") continue;
      const h = hoursSince(d.updatedAt, nowMs);
      if (h < REVIEW_DELAY_SUPPORTING_HOURS) continue;
      out.push({
        id: stableSignalId(["review_delay_risk", "supporting", d.id]),
        signalType: "review_delay_risk",
        severity: "warning",
        entityType: snapshot.entityType || "legal_workflow",
        entityId: listingId,
        actorType: snapshot.actorType || "unknown",
        workflowType: snapshot.workflowType || "unknown",
        observedAt: snapshot.builtAt,
        explanation:
          "Supporting upload awaiting review beyond the configured operational window — prioritize if downstream steps depend on it.",
        metadata: {
          hoursOpenRounded: Math.round(h),
          slaHours: REVIEW_DELAY_SUPPORTING_HOURS,
        },
      });
    }

    for (const c of snapshot.verificationCases) {
      if (c.status !== "in_review" && c.status !== "pending") continue;
      const ref = c.updatedAt > c.createdAt ? c.updatedAt : c.createdAt;
      const h = hoursSince(ref, nowMs);
      if (h < REVIEW_DELAY_VERIFICATION_HOURS) continue;
      out.push({
        id: stableSignalId(["review_delay_risk", "verification", c.id]),
        signalType: "review_delay_risk",
        severity: c.status === "in_review" ? "critical" : "warning",
        entityType: snapshot.entityType || "legal_workflow",
        entityId: listingId,
        actorType: snapshot.actorType || "unknown",
        workflowType: snapshot.workflowType || "unknown",
        observedAt: snapshot.builtAt,
        explanation:
          "Verification backlog signal: case status indicates ongoing review beyond the configured SLA.",
        metadata: {
          caseStatus: c.status,
          hoursSinceReferenceRounded: Math.round(h),
          slaHours: REVIEW_DELAY_VERIFICATION_HOURS,
        },
      });
    }

    return out;
  },
};
