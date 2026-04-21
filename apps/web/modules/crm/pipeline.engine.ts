import type { LecipmBrokerCrmLeadStatus } from "@prisma/client";
import type { PipelineEngineInput, PipelineEngineOutput } from "./crm.types";
import { pipelineLog } from "./crm-pipeline-logger";

/** Deterministic pipeline suggestions — broker approves via UI / API (`updateBrokerCrmLeadStatus`). */
export function evaluatePipelineTransition(input: PipelineEngineInput): PipelineEngineOutput {
  const rationale: string[] = [];
  const recommendedActions: string[] = [];

  let next: LecipmBrokerCrmLeadStatus = input.currentStatus;

  const highIntent =
    input.priorityLabel === "high" || (input.intentScore !== undefined && input.intentScore >= 70);

  switch (input.activity) {
    case "lead_created":
      next = "new";
      rationale.push("Lead created — default stage NEW.");
      recommendedActions.push("Send welcome / acknowledgment (broker template).");
      break;
    case "email_opened":
      if (input.currentStatus === "new") next = "contacted";
      rationale.push("Email engagement detected — elevate to CONTACTED when appropriate.");
      recommendedActions.push("Follow up within SLA; log outcome in CRM.");
      break;
    case "listing_viewed":
      if (input.currentStatus === "new") next = "contacted";
      rationale.push("Listing engagement — buyer is exploring inventory.");
      recommendedActions.push("Share comps or propose viewing.");
      break;
    case "message_sent":
      if (input.currentStatus === "new") next = "contacted";
      rationale.push("Conversation started.");
      recommendedActions.push("Maintain thread; qualify budget and timeline.");
      break;
    case "call_completed":
      if (!["negotiating", "visit_scheduled", "closed", "lost"].includes(input.currentStatus)) {
        next = "qualified";
      }
      rationale.push("Voice contact completed — deepen qualification.");
      recommendedActions.push("Schedule visit or send listing shortlist.");
      break;
    case "visit_scheduled":
      next = "visit_scheduled";
      rationale.push("Physical or virtual visit scheduled.");
      recommendedActions.push("Prepare disclosure package where applicable.");
      break;
    case "deal_created":
      next = "negotiating";
      rationale.push("Deal workspace opened — negotiation stage.");
      recommendedActions.push("Drive milestones in deal coordination hub.");
      break;
    case "status_manual_change":
      next = input.currentStatus;
      rationale.push("No automatic transition — honour manual CRM update.");
      break;
    default:
      rationale.push("Unknown activity — no automatic transition.");
  }

  if (
    highIntent &&
    next !== "negotiating" &&
    next !== "visit_scheduled" &&
    next !== "closed" &&
    next !== "lost"
  ) {
    if (next === "new" || next === "contacted") next = "qualified";
    rationale.push("High-intent signals — bias toward QUALIFIED.");
    recommendedActions.push("Accelerate viewing or mortgage pre-approval checklist.");
  }

  const out: PipelineEngineOutput = {
    nextStatus: next,
    recommendedActions,
    rationale,
  };

  pipelineLog.info("evaluatePipelineTransition", {
    activity: input.activity,
    from: input.currentStatus,
    to: out.nextStatus,
  });

  return out;
}
