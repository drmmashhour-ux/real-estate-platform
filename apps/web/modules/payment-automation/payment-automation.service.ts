import { prisma } from "@/lib/db";
import { evaluateReleaseReadiness } from "@/modules/payments-ops/release-readiness.service";
import { evaluateRefundReadiness } from "@/modules/payments-ops/refund-readiness.service";
import { logPaymentOpsEvent } from "@/modules/payments-ops/payments-ops-audit.service";
import { scanPaymentRisks } from "./payment-risk.service";

export async function buildPaymentAutomationSnapshot(dealId: string) {
  const [payments, release, risks] = await Promise.all([
    prisma.lecipmDealPayment.findMany({ where: { dealId } }),
    evaluateReleaseReadiness(dealId),
    scanPaymentRisks(dealId),
  ]);

  const refundDrafts = await Promise.all(
    payments
      .filter((p) => ["confirmed", "held"].includes(p.status))
      .map(async (p) => ({
        paymentId: p.id,
        readiness: await evaluateRefundReadiness(dealId, p.id),
      })),
  );

  return {
    payments,
    releaseReadiness: release,
    refundDrafts,
    risks,
    disclaimer:
      "Automation surfaces drafts and reminders only — no funds move without authorized confirmation aligned with your workflow.",
  };
}

export async function prepareReleaseDraft(dealId: string, actorUserId: string) {
  const r = await evaluateReleaseReadiness(dealId);
  await logPaymentOpsEvent(dealId, "release_draft_evaluated", { ready: r.ready, blockers: r.blockers }, actorUserId);
  return r;
}

export async function prepareRefundDraft(dealId: string, paymentId: string, actorUserId: string) {
  const r = await evaluateRefundReadiness(dealId, paymentId);
  await logPaymentOpsEvent(dealId, "refund_draft_evaluated", { paymentId, ready: r.ready }, actorUserId);
  return r;
}
