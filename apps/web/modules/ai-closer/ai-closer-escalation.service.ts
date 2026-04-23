import type {
  AiCloserEscalationTarget,
  AiCloserObjectionKey,
  AiCloserRouteContext,
  AiCloserStage,
} from "./ai-closer.types";

export type EscalationDecision = {
  shouldEscalate: boolean;
  target: AiCloserEscalationTarget;
  reason: string;
  urgency: "low" | "medium" | "high";
};

export function evaluateCloserEscalation(input: {
  stage: AiCloserStage;
  objection: AiCloserObjectionKey;
  confidence: number;
  route: AiCloserRouteContext;
  hotLead?: boolean;
  visitRequested?: boolean;
}): EscalationDecision {
  if (input.stage === "ESCALATE_TO_BROKER" || input.objection === "human_requested") {
    return {
      shouldEscalate: true,
      target: input.route === "investor" ? "investor_contact" : "broker",
      reason: "Human explicitly requested or transactional complexity flagged.",
      urgency: "high",
    };
  }

  if (input.objection === "complex_transactional") {
    return {
      shouldEscalate: true,
      target: "broker",
      reason: "Legal/financing/notary nuance — licensed broker or specialist.",
      urgency: "medium",
    };
  }

  if (input.hotLead && input.visitRequested) {
    return {
      shouldEscalate: true,
      target: "broker",
      reason: "Hot lead with visit intent — broker should own confirmation.",
      urgency: "high",
    };
  }

  if (input.confidence < 0.42) {
    return {
      shouldEscalate: true,
      target: input.route === "investor" ? "investor_contact" : "sales_admin",
      reason: "Assistant confidence below threshold — human QA path.",
      urgency: "low",
    };
  }

  return {
    shouldEscalate: false,
    target: "broker",
    reason: "Assistant suggestions sufficient for next rep turn.",
    urgency: "low",
  };
}
