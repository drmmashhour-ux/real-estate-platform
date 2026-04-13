import { prisma } from "@/lib/db";
import type { RuleEngineResult } from "./types";

export async function replaceDraftAlerts(draftId: string, alerts: RuleEngineResult["alerts"]) {
  await prisma.legalFormAlert.deleteMany({ where: { draftId } });
  if (alerts.length === 0) return;
  await prisma.legalFormAlert.createMany({
    data: alerts.map((a) => ({
      draftId,
      severity: a.severity,
      alertType: a.alertType,
      title: a.title,
      body: a.body,
      sourceType: a.sourceType ?? null,
      sourceRef: a.sourceRef ?? null,
    })),
  });
}
