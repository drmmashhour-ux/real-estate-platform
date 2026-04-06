import { prisma } from "@/lib/db";
import { logError, logInfo } from "@/lib/logger";
import { getMoneyAutomationSettings } from "@/lib/payments/money-automation-settings";
import { executeOrchestratedPayout } from "@/lib/payments/payout";

export type BnhubPayoutRunnerResult = {
  ok: true;
  skipped?: string;
  processed: number;
  failed: number;
};

/**
 * Batch runner for scheduled Stripe Connect transfers (platform balance → host connected account).
 * Respects global kill switches and per-run limits.
 */
export async function runBnhubPayoutRunner(): Promise<BnhubPayoutRunnerResult> {
  const settings = getMoneyAutomationSettings();
  if (!settings.payoutsEnabled) {
    logInfo("[payout-runner] skipped — BNHUB_PAYOUTS_DISABLED");
    return { ok: true, skipped: "payouts_disabled", processed: 0, failed: 0 };
  }
  if (settings.autoPayoutsBlocked) {
    logInfo("[payout-runner] skipped — BNHUB_AUTO_PAYOUTS_BLOCKED");
    return { ok: true, skipped: "auto_payouts_blocked", processed: 0, failed: 0 };
  }

  const now = new Date();
  const rows = await prisma.orchestratedPayout.findMany({
    where: {
      status: "scheduled",
      provider: "stripe",
      payoutMethod: { not: "manual" },
      scheduledAt: { lte: now },
      providerRef: null,
    },
    take: settings.payoutRunLimit,
    orderBy: { scheduledAt: "asc" },
  });

  let processed = 0;
  let failed = 0;
  const skipErrors = new Set(["refund_pending", "stay_not_completed"]);
  for (const row of rows) {
    const r = await executeOrchestratedPayout(row.id);
    if (r.ok) {
      processed += 1;
    } else if (skipErrors.has(r.error)) {
      logInfo("[payout-runner] skip — will retry later", { payoutId: row.id, error: r.error });
    } else {
      failed += 1;
      logError("[payout-runner] row failed", new Error(r.error));
    }
  }

  return { ok: true, processed, failed };
}
