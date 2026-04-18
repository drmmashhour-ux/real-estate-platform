import { prisma } from "@/lib/db";
import { getClosingReadiness } from "@/modules/closing/closing-readiness.service";
import { listConditions } from "@/modules/deal-execution/condition-tracker.service";
import { getLatestSignatureSummary } from "@/modules/signature/signature-tracking.service";

export type ReleaseReadinessResult = {
  ready: boolean;
  blockers: string[];
  warnings: string[];
};

/**
 * Release readiness — policy gate; broker still authorizes any release instruction.
 */
export async function evaluateReleaseReadiness(dealId: string): Promise<ReleaseReadinessResult> {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const closing = await getClosingReadiness(dealId);
  if (!closing.ready) {
    blockers.push(...closing.missingItems);
    warnings.push(...closing.warnings);
  }

  const open = await listConditions(dealId);
  for (const c of open.filter((x) => x.status !== "fulfilled")) {
    if (c.conditionType.toLowerCase().includes("financ")) {
      blockers.push(`Financing condition open: ${c.conditionType}`);
    }
  }

  const sig = await getLatestSignatureSummary(dealId);
  const sigOk =
    sig &&
    sig.status === "completed" &&
    sig.participantCount > 0 &&
    sig.signedCount >= sig.participantCount;
  if (!sigOk) {
    blockers.push("Signatures not complete for latest session");
  }

  const pendingRelease = await prisma.lecipmDealPayment.findFirst({
    where: {
      dealId,
      paymentKind: { in: ["deposit", "additional_sum", "balance_due"] },
      status: { in: ["confirmed", "held", "release_pending"] },
    },
  });
  if (!pendingRelease) {
    warnings.push("No in-file payment in a releasable state — verify deal payments.");
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
  };
}
