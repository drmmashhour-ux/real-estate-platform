import type { CareHubEventKind, CareHubEventSeverity } from "@prisma/client";

import { prisma } from "@/lib/db";

import { fanOutCareEventNotification } from "./soins-notifications.service";

export async function createCareEvent(input: {
  residentId: string;
  type: CareHubEventKind;
  message: string;
  severity: CareHubEventSeverity;
  alertCode?: string;
  skipNotifications?: boolean;
}) {
  const row = await prisma.careEvent.create({
    data: {
      residentId: input.residentId,
      type: input.type,
      message: input.message,
      severity: input.severity,
    },
  });

  if (!input.skipNotifications) {
    await fanOutCareEventNotification({
      residentId: input.residentId,
      type: input.type,
      message: input.message,
      severity: input.severity,
      alertCode: input.alertCode,
    });
  }

  return row;
}

export async function listCareEvents(residentId: string, take = 50) {
  return prisma.careEvent.findMany({
    where: { residentId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
