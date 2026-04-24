import { prisma } from "@/lib/db";
import {
  DEAL_PLAYBOOK_STEPS,
  type DealPlaybookStepKey,
  type PlaybookStepDefinition,
} from "./deal-playbook.constants";

export type PlaybookDelay = { stepKey: string; daysOverdue: number; message: string };

export type DealPlaybookView = {
  dealId: string;
  currentStep: DealPlaybookStepKey;
  currentStepMeta: PlaybookStepDefinition;
  completedSteps: DealPlaybookStepKey[];
  nextAction: string;
  progressPercent: number;
  steps: Array<PlaybookStepDefinition & { done: boolean }>;
  checklist: string[];
  aiSuggestions: string[];
  reminders: string[];
  timelineHints: string[];
  documentHints: string[];
  delays: PlaybookDelay[];
  riskFlags: string[];
};

function isTruthyDone(key: DealPlaybookStepKey, signals: DealPlaybookSignals): boolean {
  switch (key) {
    case "lead_intake":
      return Boolean(signals.leadId || signals.crmStage);
    case "property_selection":
      return Boolean(signals.listingId);
    case "offer_generation_ai":
      return signals.hasOfferDraft;
    case "broker_review_signature":
      return signals.offerDraftApprovedOrSent || signals.promiseArtifactApproved;
    case "offer_submission":
      return (
        ["offer_submitted", "accepted", "inspection", "financing", "closing_scheduled", "closed"].includes(
          signals.dealStatus,
        ) || signals.offerDraftSent
      );
    case "negotiation":
      return signals.negotiationThreads > 0 || ["accepted", "inspection", "financing", "closing_scheduled", "closed"].includes(signals.dealStatus);
    case "conditions_inspection_financing":
      return ["inspection", "financing", "closing_scheduled", "closed"].includes(signals.dealStatus);
    case "notary_coordination":
      return Boolean(
        signals.notaryNotaryId || signals.notaryInviteSent || signals.notaryAppointmentAt || ["closing_scheduled", "closed"].includes(signals.dealStatus),
      );
    case "closing":
      return ["closing_scheduled", "closed"].includes(signals.dealStatus) || Boolean(signals.notaryAppointmentAt);
    case "payment_tracking":
      return signals.dealStatus === "closed" || signals.dealPayments > 0;
    default:
      return false;
  }
}

type DealPlaybookSignals = {
  dealStatus: string;
  crmStage: string | null;
  leadId: string | null;
  listingId: string | null;
  hasOfferDraft: boolean;
  offerDraftApprovedOrSent: boolean;
  offerDraftSent: boolean;
  promiseArtifactApproved: boolean;
  negotiationThreads: number;
  closingConditionsTotal: number;
  openConditionsPastDue: number;
  notaryNotaryId: string | null;
  notaryInviteSent: boolean;
  notaryAppointmentAt: Date | null;
  dealPayments: number;
  closeProbability: number | null;
  riskLevel: string | null;
  dealUpdatedAt: Date;
};

async function loadSignals(dealId: string): Promise<DealPlaybookSignals | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      status: true,
      crmStage: true,
      leadId: true,
      listingId: true,
      closeProbability: true,
      riskLevel: true,
      updatedAt: true,
    },
  });
  if (!deal) return null;

  const [
    offerDraft,
    promiseApproved,
    negotiationThreads,
    conditions,
    notary,
    payments,
  ] = await Promise.all([
    prisma.offerDraft.findFirst({
      where: { dealId },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    }),
    prisma.lecipmLegalDocumentArtifact.findFirst({
      where: { dealId, kind: "PROMISE_TO_PURCHASE", status: "APPROVED" },
      select: { id: true },
    }),
    prisma.negotiationThread.count({ where: { dealId } }),
    prisma.dealClosingCondition.findMany({
      where: { dealId },
      select: { deadline: true, status: true, fulfilledAt: true },
      take: 80,
    }),
    prisma.dealNotaryCoordination.findUnique({
      where: { dealId },
      select: { notaryId: true, invitationSentAt: true, appointmentAt: true },
    }),
    prisma.platformPayment.count({ where: { dealId } }),
  ]);

  const now = Date.now();
  let openConditionsPastDue = 0;
  for (const c of conditions) {
    const open = c.status !== "fulfilled" && !c.fulfilledAt;
    if (open && c.deadline && c.deadline.getTime() < now) openConditionsPastDue += 1;
  }

  const od = offerDraft?.status;
  return {
    dealStatus: deal.status,
    crmStage: deal.crmStage,
    leadId: deal.leadId,
    listingId: deal.listingId,
    hasOfferDraft: Boolean(offerDraft),
    offerDraftApprovedOrSent: od === "APPROVED" || od === "SENT",
    offerDraftSent: od === "SENT",
    promiseArtifactApproved: Boolean(promiseApproved),
    negotiationThreads,
    closingConditionsTotal: conditions.length,
    openConditionsPastDue,
    notaryNotaryId: notary?.notaryId ?? null,
    notaryInviteSent: Boolean(notary?.invitationSentAt),
    notaryAppointmentAt: notary?.appointmentAt ?? null,
    dealPayments: payments,
    closeProbability: deal.closeProbability,
    riskLevel: deal.riskLevel,
    dealUpdatedAt: deal.updatedAt,
  };
}

function buildNextAction(current: PlaybookStepDefinition, signals: DealPlaybookSignals): string {
  switch (current.key) {
    case "lead_intake":
      return "Complete CRM intake and link any mandatory brokerage disclosures.";
    case "property_selection":
      return signals.listingId ? "Validate listing inclusions/exclusions, then move to offer drafting." : "Attach a CRM listing (or property record) to this deal.";
    case "offer_generation_ai":
      return "Open Auto offer draft — generate, edit, and save a broker-reviewed package.";
    case "broker_review_signature":
      return "Approve the Promise-to-Purchase in the legal engine and complete broker digital signature.";
    case "offer_submission":
      return "Dispatch or deliver the promise through your office workflow and log acknowledgement.";
    case "negotiation":
      return "Document counters in writing and refresh condition deadlines if terms change.";
    case "conditions_inspection_financing":
      return signals.openConditionsPastDue > 0 ?
          "Urgent: one or more conditions are past due — waive, extend, or declare in writing."
        : "Track inspection/financing deliverables until waived or fulfilled.";
    case "notary_coordination":
      return "Assign notary, send the package, and confirm a signing appointment.";
    case "closing":
      return "Finalize adjustments, keys, and archiving for the signing appointment.";
    case "payment_tracking":
      return "Reconcile commissions / ledger entries and mark the deal outcome in CRM.";
    default:
      return "Advance the file with written documentation only.";
  }
}

function buildAutomationHints(current: PlaybookStepDefinition, signals: DealPlaybookSignals) {
  const reminders: string[] = [];
  const timelineHints: string[] = [];
  const documentHints: string[] = [];

  if (current.order >= 2 && current.order <= 4) {
    documentHints.push("Promise-to-purchase + annexes should match the listing file and buyer instructions.");
  }
  if (current.key === "conditions_inspection_financing") {
    timelineHints.push("Typical financing review: 10–21 bank days — set reminders 3 days before each deadline.");
    reminders.push("Send calendar nudges to the buyer when inspection reports are pending upload.");
  }
  if (current.key === "notary_coordination") {
    timelineHints.push("Book notary only after material conditions are clear or waived in writing.");
    documentHints.push("Deed draft + certificate of location + mortgage instructions usually flow through notary.");
  }
  if (signals.dealStatus === "CONFLICT_REQUIRES_DISCLOSURE") {
    reminders.push("Conflict disclosure path active — do not advance without brokerage compliance clearance.");
  }

  return { reminders, timelineHints, documentHints };
}

function computeRiskFlags(signals: DealPlaybookSignals): string[] {
  const flags: string[] = [];
  if (signals.dealStatus === "CONFLICT_REQUIRES_DISCLOSURE") {
    flags.push("Deal status requires conflict disclosure review.");
  }
  if (signals.riskLevel && signals.riskLevel.toUpperCase() === "HIGH") {
    flags.push("Deal intelligence flags HIGH risk — tighten documentation discipline.");
  }
  if (signals.closeProbability != null && signals.closeProbability < 0.35) {
    flags.push("Close probability under 35% — confirm buyer commitment and financing realism.");
  }
  const staleMs = Date.now() - signals.dealUpdatedAt.getTime();
  if (staleMs > 14 * 86_400_000 && signals.dealStatus !== "closed") {
    flags.push("No file update in 14+ days — refresh party contact and next milestones.");
  }
  if (signals.openConditionsPastDue > 0) {
    flags.push(`${signals.openConditionsPastDue} condition(s) appear overdue.`);
  }
  return flags;
}

function computeDelays(signals: DealPlaybookSignals): PlaybookDelay[] {
  const delays: PlaybookDelay[] = [];
  if (signals.openConditionsPastDue > 0) {
    delays.push({
      stepKey: "conditions_inspection_financing",
      daysOverdue: signals.openConditionsPastDue,
      message: "One or more closing conditions have passed their deadline without fulfilment.",
    });
  }
  return delays;
}

/**
 * Computes the guided playbook view from live deal signals (read-mostly; persist via sync).
 */
export async function computeDealPlaybookView(dealId: string): Promise<DealPlaybookView | null> {
  const signals = await loadSignals(dealId);
  if (!signals) return null;

  const completed = new Set<DealPlaybookStepKey>();
  for (const step of DEAL_PLAYBOOK_STEPS) {
    if (isTruthyDone(step.key, signals)) completed.add(step.key);
  }

  let current: PlaybookStepDefinition = DEAL_PLAYBOOK_STEPS[DEAL_PLAYBOOK_STEPS.length - 1]!;
  for (const step of DEAL_PLAYBOOK_STEPS) {
    if (!completed.has(step.key)) {
      current = step;
      break;
    }
  }
  if (completed.size === DEAL_PLAYBOOK_STEPS.length) {
    current = DEAL_PLAYBOOK_STEPS[DEAL_PLAYBOOK_STEPS.length - 1]!;
  }

  const completedOrdered = DEAL_PLAYBOOK_STEPS.filter((s) => completed.has(s.key)).map((s) => s.key);
  const progressPercent = Math.round((completed.size / DEAL_PLAYBOOK_STEPS.length) * 100);
  const nextAction = buildNextAction(current, signals);
  const { reminders, timelineHints, documentHints } = buildAutomationHints(current, signals);
  const riskFlags = computeRiskFlags(signals);
  const delays = computeDelays(signals);

  const steps = DEAL_PLAYBOOK_STEPS.map((s) => ({ ...s, done: completed.has(s.key) }));

  return {
    dealId,
    currentStep: current.key,
    currentStepMeta: current,
    completedSteps: completedOrdered,
    nextAction,
    progressPercent,
    steps,
    checklist: current.checklist,
    aiSuggestions: current.aiSuggestions,
    reminders,
    timelineHints,
    documentHints,
    delays,
    riskFlags,
  };
}
