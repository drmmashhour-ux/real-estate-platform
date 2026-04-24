import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { ClosingRoomReadiness } from "@/modules/closing/closing.types";
import { checklistItemCountsForClosing } from "@/modules/closing/closing.types";
import { qcExecutionBlockers } from "@/modules/quebec-closing/quebec-closing-gates";

const TAG = "[closing-orchestrator]";

/**
 * Final closing readiness — deterministic — does not auto-confirm closing.
 *
 * Blocks on: required documents not VERIFIED; rejected docs;
 * checklist rows that apply to closing (non-OPTIONAL priority) not COMPLETE or BLOCKED;
 * required signatures not SIGNED or DECLINED.
 */
export async function evaluateFinalClosingReadiness(dealId: string): Promise<ClosingRoomReadiness> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { status: true, lecipmExecutionPipelineState: true },
  });

  if (!deal) {
    return {
      readinessStatus: "NOT_READY",
      blockers: ["Deal not found."],
      nextSteps: [],
    };
  }

  if (deal.status === "cancelled") {
    return {
      readinessStatus: "NOT_READY",
      blockers: ["Deal is cancelled."],
      nextSteps: [],
    };
  }

  if (deal.lecipmExecutionPipelineState === "archived") {
    return {
      readinessStatus: "NOT_READY",
      blockers: ["Execution pipeline is archived."],
      nextSteps: [],
    };
  }

  const blockers: string[] = [];
  const nextSteps: string[] = [];

  const session = await prisma.dealClosing.findUnique({ where: { dealId } });
  if (!session || session.status === "NOT_STARTED") {
    return {
      readinessStatus: "NOT_READY",
      blockers: ["Closing session has not been started."],
      nextSteps: ["Start the closing room from an eligible pipeline deal."],
    };
  }

  if (session.status === "CLOSED") {
    return {
      readinessStatus: "NOT_READY",
      blockers: ["Closing already completed for this deal."],
      nextSteps: [],
    };
  }

  const docs = await prisma.dealClosingDocument.findMany({ where: { dealId } });

  for (const d of docs) {
    if (d.required && d.status !== "VERIFIED") {
      blockers.push(`Required document not verified: ${d.title} (${d.status})`);
    }
    if (d.status === "REJECTED") {
      blockers.push(`Rejected document pending re-upload: ${d.title}`);
    }
  }

  const checklist = await prisma.dealClosingChecklist.findMany({ where: { dealId } });

  for (const c of checklist) {
    const counts = checklistItemCountsForClosing(c.priority);
    if (!counts) continue;

    if (c.status === "BLOCKED") {
      blockers.push(`Blocked checklist item: ${c.title}`);
    } else if (c.status !== "COMPLETE") {
      blockers.push(`Checklist item not complete: ${c.title} (${c.status})`);
    }
  }

  const sigs = await prisma.dealClosingSignature.findMany({ where: { dealId } });

  for (const s of sigs) {
    if (!s.required) continue;
    if (s.status === "DECLINED") {
      blockers.push(`Signature declined — must resolve: ${s.signerName} (${s.signerRole})`);
    } else if (s.status !== "SIGNED") {
      blockers.push(`Signature pending: ${s.signerName} (${s.signerRole})`);
    }
  }

  const [qcConditions, qcNotary, qcChecklist] = await Promise.all([
    prisma.dealClosingCondition.findMany({ where: { dealId } }),
    prisma.dealNotaryCoordination.findUnique({ where: { dealId } }),
    prisma.dealQuebecNotaryChecklistItem.findMany({ where: { dealId } }),
  ]);
  blockers.push(
    ...qcExecutionBlockers({
      closing: session,
      conditions: qcConditions,
      notary: qcNotary,
      notaryChecklist: qcChecklist,
    }),
  );

  if (docs.some((d) => d.required && d.status !== "VERIFIED")) {
    nextSteps.push("Verify all required documents.");
  }
  const applicableChecklist = checklist.filter((c) => checklistItemCountsForClosing(c.priority));
  if (applicableChecklist.some((c) => c.status !== "COMPLETE")) {
    nextSteps.push("Complete every applicable checklist row (OPEN / IN_PROGRESS blocks final readiness).");
  }
  if (applicableChecklist.some((c) => c.status === "IN_PROGRESS")) {
    nextSteps.push("Finish in-progress checklist items.");
  }
  const requiredSigs = sigs.filter((s) => s.required);
  if (requiredSigs.some((s) => s.status !== "SIGNED")) {
    nextSteps.push("Collect outstanding required signatures.");
  }

  let readinessStatus: ClosingRoomReadiness["readinessStatus"];
  if (blockers.length === 0) {
    readinessStatus = "READY";
  } else {
    const requiredDocs = docs.filter((d) => d.required);
    const verifiedRequired = requiredDocs.filter((d) => d.status === "VERIFIED").length;
    const completeItems = applicableChecklist.filter((c) => c.status === "COMPLETE").length;
    const signedReq = requiredSigs.filter((s) => s.status === "SIGNED").length;
    const progressUnits = verifiedRequired + completeItems + signedReq;
    const denom = requiredDocs.length + applicableChecklist.length + requiredSigs.length;
    const progressRatio = progressUnits / (denom > 0 ? denom : 1);
    readinessStatus =
      progressRatio >= 0.35 || applicableChecklist.some((c) => c.status === "IN_PROGRESS") ?
        "PARTIALLY_READY"
      : "NOT_READY";
  }

  logInfo(`${TAG}`, { dealId, readinessStatus, blockers: blockers.length });

  return { readinessStatus, blockers, nextSteps };
}

export async function syncDealClosingReadiness(dealId: string): Promise<void> {
  const closingFirst = await prisma.dealClosing.findUnique({
    where: { dealId },
    select: { status: true },
  });
  if (!closingFirst || closingFirst.status === "CLOSED") return;

  const r = await evaluateFinalClosingReadiness(dealId);
  const closing = await prisma.dealClosing.findUnique({
    where: { dealId },
    select: { status: true },
  });
  if (!closing || closing.status === "CLOSED") return;

  let nextStatus = closing.status;
  if (r.readinessStatus === "READY" && closing.status === "IN_PROGRESS") nextStatus = "READY_TO_CLOSE";
  if (r.readinessStatus !== "READY" && closing.status === "READY_TO_CLOSE") nextStatus = "IN_PROGRESS";

  await prisma.dealClosing.update({
    where: { dealId },
    data: {
      readinessStatus: r.readinessStatus,
      status: nextStatus,
      updatedAt: new Date(),
    },
  });
}
