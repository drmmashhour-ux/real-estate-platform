import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import type { DealPlaybookView } from "./deal-playbook-engine.service";
import { computeDealPlaybookView } from "./deal-playbook-engine.service";

/** Persists latest computed playbook row for dashboards / reporting. */
export async function syncDealPlaybookRecord(dealId: string, precomputed?: DealPlaybookView | null) {
  const view = precomputed ?? (await computeDealPlaybookView(dealId));
  if (!view) return null;

  const trackingSnapshot = {
    progressPercent: view.progressPercent,
    delays: view.delays,
    riskFlags: view.riskFlags,
    syncedAt: new Date().toISOString(),
  };

  return prisma.dealPlaybook.upsert({
    where: { dealId },
    create: {
      dealId,
      currentStep: view.currentStep,
      completedSteps: asInputJsonValue(view.completedSteps),
      nextAction: view.nextAction,
      progressPercent: view.progressPercent,
      trackingSnapshot: asInputJsonValue(trackingSnapshot),
    },
    update: {
      currentStep: view.currentStep,
      completedSteps: asInputJsonValue(view.completedSteps),
      nextAction: view.nextAction,
      progressPercent: view.progressPercent,
      trackingSnapshot: asInputJsonValue(trackingSnapshot),
    },
  });
}
