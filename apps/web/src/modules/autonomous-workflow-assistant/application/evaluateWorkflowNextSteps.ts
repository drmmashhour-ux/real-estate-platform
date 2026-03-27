import type { AutonomousTaskOutput } from "@/src/modules/autonomous-workflow-assistant/domain/autonomousWorkflow.types";
import type { ResolutionSnapshot } from "@/src/modules/autonomous-workflow-assistant/infrastructure/taskResolutionService";
import { AutonomousTaskType } from "@/src/modules/autonomous-workflow-assistant/domain/autonomousWorkflow.enums";
import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";
import { recommendRoutingFromStatus } from "@/src/modules/autonomous-workflow-assistant/infrastructure/workflowRoutingService";
import type { SellerDeclarationDraftStatus } from "@prisma/client";
import { generateSignatureReadinessPackage } from "@/src/modules/autonomous-workflow-assistant/application/generateSignatureReadinessPackage";
import { generateEscalationRecommendations } from "@/src/modules/autonomous-workflow-assistant/application/generateEscalationRecommendations";
import { resolveTaskPriority, type TaskPriorityReason } from "@/src/modules/autonomous-workflow-assistant/infrastructure/taskPriorityService";

const T_VALIDATION = "Declaration validation";
const T_GRAPH = "Legal graph";
const T_WORKFLOW = "Workflow status";
const T_POLICY = "Escalation policy";

function priorityFrom(reason: TaskPriorityReason) {
  return resolveTaskPriority(reason);
}

export function buildResolutionSnapshot(args: {
  draftPayload: Record<string, unknown>;
  blockingIssues: string[];
}): ResolutionSnapshot {
  const v = runDeclarationValidationDeterministic(args.draftPayload);
  return {
    missingFields: v.missingFields,
    blockingIssues: args.blockingIssues,
    contradictions: v.contradictionFlags,
    knowledgeRuleBlocks: v.knowledgeRuleBlocks ?? [],
  };
}

export function evaluateWorkflowNextSteps(args: {
  documentId: string;
  status: SellerDeclarationDraftStatus;
  draftPayload: Record<string, unknown>;
  blockingIssues: string[];
  graphFileHealth?: string;
  missingDependencies?: string[];
  signatureReady?: boolean;
  signatureReasons?: string[];
  criticalGraphIssueCount?: number;
}): AutonomousTaskOutput[] {
  const v = runDeclarationValidationDeterministic(args.draftPayload);
  const routing = recommendRoutingFromStatus(args.status);
  const out: AutonomousTaskOutput[] = [];
  const graphCriticallyBlocked = args.graphFileHealth === "blocked" || (args.criticalGraphIssueCount ?? 0) > 0;

  out.push({
    taskType: AutonomousTaskType.CASE_SUMMARY_DRAFT,
    priority: priorityFrom("case_summary"),
    targetUserRole: "admin",
    summary: "Case command summary draft",
    recommendedAction: [
      `File health: ${args.graphFileHealth ?? "unknown"}`,
      args.blockingIssues.length ? `Blocking issues: ${args.blockingIssues.slice(0, 3).join("; ")}` : "No blocking issues detected.",
      v.missingFields.length ? `Missing fields: ${v.missingFields.slice(0, 3).join("; ")}` : "No missing fields detected.",
      (args.missingDependencies?.length ?? 0) ? `Missing dependencies: ${(args.missingDependencies ?? []).slice(0, 3).join("; ")}` : "",
    ]
      .filter(Boolean)
      .join(" | "),
    blockedBy: args.blockingIssues.length ? args.blockingIssues : undefined,
    sourceRefs: [`document:${args.documentId}`, ...args.blockingIssues.slice(0, 2)],
    confidence: 0.55,
    requiresApproval: false,
    why: "Summarizes current file health and open items for the case view.",
    triggerLabel: T_VALIDATION,
  });

  const signaturePkg = generateSignatureReadinessPackage({
    validationComplete:
      v.missingFields.length === 0 &&
      v.contradictionFlags.length === 0 &&
      (v.knowledgeRuleBlocks?.length ?? 0) === 0,
    blockingIssues: args.blockingIssues,
    signatureReady: args.signatureReady ?? false,
    signatureReasons: args.signatureReasons ?? [],
  });
  const sigReason: TaskPriorityReason = signaturePkg.ready ? "signature_ready_pending_review" : "signature_blocked";
  out.push({
    taskType: AutonomousTaskType.SIGNATURE_READINESS,
    priority: priorityFrom(sigReason),
    targetUserRole: "reviewer",
    summary: "Signature readiness checklist",
    recommendedAction: `Checklist: ${signaturePkg.checklist.join(" | ")}`,
    sourceRefs: [...(args.signatureReasons ?? []).slice(0, 4), ...(args.blockingIssues ?? []).slice(0, 2)],
    confidence: 0.7,
    requiresApproval: false,
    why: "Lists what is left before a signature step is safe to consider.",
    triggerLabel: `${T_GRAPH} + ${T_VALIDATION}`,
  });

  if ((v.knowledgeRuleBlocks?.length ?? 0) > 0) {
    const msgs = v.knowledgeRuleBlocks ?? [];
    out.push({
      taskType: AutonomousTaskType.NOTIFY_BLOCKER,
      priority: priorityFrom("mandatory_disclosure"),
      targetUserRole: "seller",
      summary: `Mandatory disclosure: ${msgs.length} rule(s) block submission`,
      recommendedAction: msgs.slice(0, 6).join(" | "),
      blockedBy: msgs,
      sourceRefs: msgs.slice(0, 8),
      confidence: 0.92,
      requiresApproval: false,
      why: "Knowledge rules mark mandatory disclosures that are not satisfied.",
      triggerLabel: T_VALIDATION,
      resolutionCheck: { kind: "knowledge_blocks", messages: msgs.slice() },
    });
  }

  if (v.missingFields.length) {
    const followUp = v.missingFields.slice(0, 5).map((m) => `Ask for: ${m}`).join(" | ");
    out.push({
      taskType: AutonomousTaskType.CHECKLIST_MISSING_ITEMS,
      priority: priorityFrom("missing_mandatory_fields"),
      targetUserRole: "seller",
      summary: `${v.missingFields.length} required field(s) incomplete`,
      recommendedAction: [`Complete missing fields before review.`, `Follow-up detail: ${followUp}`].join(" "),
      blockedBy: v.missingFields,
      sourceRefs: v.missingFields.slice(0, 8),
      confidence: 0.9,
      requiresApproval: false,
      why: "Required declaration fields are empty or incomplete.",
      triggerLabel: T_VALIDATION,
      resolutionCheck: { kind: "missing_fields", keys: v.missingFields.slice() },
    });
  }

  if (v.contradictionFlags.length) {
    const flags = v.contradictionFlags;
    out.push({
      taskType: AutonomousTaskType.FOLLOW_UP_QUESTIONS,
      priority: priorityFrom("contradiction"),
      targetUserRole: "reviewer",
      summary: "Follow-up required for detected contradictions",
      recommendedAction: flags
        .slice(0, 4)
        .map((c) => `Clarify contradiction: ${c}`)
        .join(" | "),
      blockedBy: flags,
      sourceRefs: flags.slice(0, 6),
      confidence: 0.95,
      requiresApproval: false,
      why: "Contradictions were detected between answers; they must be resolved before approval.",
      triggerLabel: T_VALIDATION,
      resolutionCheck: { kind: "contradictions", flags: flags.slice() },
    });

    out.push({
      taskType: AutonomousTaskType.REVIEWER_COMMENT_DRAFT,
      priority: priorityFrom("contradiction"),
      targetUserRole: "reviewer",
      summary: "Draft reviewer comment (contradictions)",
      recommendedAction: `Draft comment: Please review contradictions and request clarification from the seller. Flags: ${flags.slice(0, 3).join(" | ")}`,
      blockedBy: flags,
      sourceRefs: flags.slice(0, 6),
      confidence: 0.74,
      requiresApproval: false,
      why: "Prepares a neutral review comment; does not send a signature request.",
      triggerLabel: T_VALIDATION,
      resolutionCheck: { kind: "contradictions", flags: flags.slice() },
    });
  }

  if (args.blockingIssues.length) {
    const blockerReason: TaskPriorityReason = graphCriticallyBlocked ? "unresolved_graph_blocker" : "graph_blockers_present";
    const msgs = args.blockingIssues.slice(0, 6);
    out.push({
      taskType: AutonomousTaskType.NOTIFY_BLOCKER,
      priority: priorityFrom(blockerReason),
      targetUserRole: "admin",
      summary: "Legal graph blockers present",
      recommendedAction: "Review blocking issues before routing to signature.",
      blockedBy: args.blockingIssues,
      sourceRefs: msgs,
      confidence: 0.85,
      requiresApproval: false,
      why: "The legal graph reports unresolved blockers that can prevent signing.",
      triggerLabel: T_GRAPH,
      resolutionCheck: { kind: "graph_blockers", messages: msgs },
    });

    out.push({
      taskType: AutonomousTaskType.REVIEWER_COMMENT_DRAFT,
      priority: priorityFrom("reviewer_comment_draft"),
      targetUserRole: "reviewer",
      summary: "Draft reviewer comment (blocking issues)",
      recommendedAction: `Draft comment: Blocking issues detected — require human remediation before signature. Blocking: ${args.blockingIssues.slice(0, 3).join(" | ")}`,
      blockedBy: args.blockingIssues,
      sourceRefs: args.blockingIssues.slice(0, 6),
      confidence: 0.74,
      requiresApproval: false,
      why: "Prepares a neutral review comment; does not send a signature request.",
      triggerLabel: T_GRAPH,
      resolutionCheck: { kind: "graph_blockers", messages: msgs },
    });
  }

  if (routing === "awaiting_review" && args.graphFileHealth !== "blocked") {
    out.push({
      taskType: AutonomousTaskType.ROUTE_TO_REVIEW,
      priority: priorityFrom("routing_suggestion"),
      targetUserRole: "reviewer",
      summary: "Document ready for human review queue",
      recommendedAction: "Assign reviewer — no auto-approval is performed.",
      sourceRefs: [`status:${args.status}`],
      confidence: 0.6,
      requiresApproval: false,
      why: "Workflow status indicates this file can enter the human review queue.",
      triggerLabel: T_WORKFLOW,
    });
  } else if (routing === "needs_changes" || args.graphFileHealth === "blocked") {
    out.push({
      taskType: AutonomousTaskType.ROUTE_NEEDS_CHANGES,
      priority: priorityFrom("route_back_required"),
      targetUserRole: "admin",
      summary: "Route back for changes",
      recommendedAction: "Route document back to the author to address blocking items and missing facts.",
      blockedBy: [...(args.blockingIssues ?? []), ...(v.missingFields ?? [])].slice(0, 4) as string[],
      sourceRefs: [...(args.blockingIssues ?? []).slice(0, 3), ...(v.missingFields ?? []).slice(0, 3)],
      confidence: 0.65,
      requiresApproval: false,
      why: "Graph or workflow status requires changes before review or signature.",
      triggerLabel: `${T_WORKFLOW} + ${T_GRAPH}`,
    });
  }

  const escalationLines = generateEscalationRecommendations({
    blockingIssues: args.blockingIssues,
    contradictions: v.contradictionFlags,
    criticalOpen: args.criticalGraphIssueCount ?? 0,
  });
  if (escalationLines.length) {
    out.push({
      taskType: AutonomousTaskType.ESCALATION_RECOMMENDATION,
      priority: priorityFrom("escalation"),
      targetUserRole: "admin",
      summary: "Escalation recommended (policy threshold met)",
      recommendedAction: escalationLines.join(" | "),
      blockedBy: [...args.blockingIssues, ...v.contradictionFlags].slice(0, 6),
      sourceRefs: [...args.blockingIssues.slice(0, 3), ...v.contradictionFlags.slice(0, 3)],
      confidence: 0.88,
      requiresApproval: false,
      why: "Escalation thresholds (blockers + critical graph) are met.",
      triggerLabel: T_POLICY,
    });
  }

  return out;
}
