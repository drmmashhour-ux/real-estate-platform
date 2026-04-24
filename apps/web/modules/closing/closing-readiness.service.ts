import { prisma } from "@/lib/db";
import { listConditions } from "@/modules/deal-execution/condition-tracker.service";
import { getLatestSignatureSummary } from "@/modules/signature/signature-tracking.service";

export type ClosingReadinessResult = {
  ready: boolean;
  missingItems: string[];
  warnings: string[];
};

function metaBool(meta: Record<string, unknown>, key: string): boolean {
  const v = meta[key];
  return v === true || v === "true" || v === 1 || v === "1";
}

/**
 * Broker-facing checklist — does not certify legal sufficiency of the file.
 */
export async function getClosingReadiness(dealId: string): Promise<ClosingReadinessResult> {
  const missing: string[] = [];
  const warnings: string[] = [];

  const [deal, sig, conditions, notaryRow] = await Promise.all([
    prisma.deal.findUnique({
      where: { id: dealId },
      select: { executionMetadata: true, lecipmExecutionPipelineState: true },
    }),
    getLatestSignatureSummary(dealId),
    listConditions(dealId),
    prisma.dealNotaryCoordination.findUnique({ where: { dealId } }),
  ]);

  const meta = (deal?.executionMetadata ?? {}) as Record<string, unknown>;

  const signaturesComplete =
    Boolean(sig) &&
    sig!.status === "completed" &&
    sig!.participantCount > 0 &&
    sig!.signedCount >= sig!.participantCount;

  if (!signaturesComplete) {
    missing.push("All required e-signatures completed in the latest session");
  }

  const openConditions = conditions.filter((c) => c.status !== "fulfilled" && c.status !== "waived");
  for (const c of openConditions) {
    missing.push(`Condition open: ${c.conditionType}`);
  }

  if (!metaBool(meta, "depositConfirmed")) {
    missing.push("Deposit confirmation (execution metadata: depositConfirmed)");
  }

  if (!metaBool(meta, "requiredAnnexesIncluded")) {
    missing.push("Required annexes (execution metadata: requiredAnnexesIncluded)");
  }

  const pipeline = deal?.lecipmExecutionPipelineState;
  if ((pipeline === "closing_ready" || pipeline === "closed") && !notaryRow?.notaryId) {
    warnings.push("No notary selected on coordination record");
  }

  if (notaryRow?.appointmentAt && notaryRow.appointmentAt < new Date()) {
    warnings.push("Notary appointment time is in the past — confirm or reschedule");
  }

  const ready = missing.length === 0;

  return {
    ready,
    missingItems: missing,
    warnings,
  };
}
