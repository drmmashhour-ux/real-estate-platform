import { prisma } from "@/lib/db";

import type { FullAutopilotMode } from "./autopilot-domain-matrix.types";
import type { KillSwitchPosition } from "./autopilot-domain-matrix.types";
import type { LecipmAutopilotDomainId } from "./autopilot-domain-matrix.types";

export type DomainKillSwitchView = {
  domainId: LecipmAutopilotDomainId;
  killSwitch: KillSwitchPosition;
  mode: FullAutopilotMode;
  changedBy?: string | null;
  changedAt?: Date | null;
  reason?: string | null;
};

export async function getKillSwitchSnapshot(domain: LecipmAutopilotDomainId): Promise<DomainKillSwitchView | null> {
  const row = await prisma.lecipmFullAutopilotDomainConfig.findUnique({
    where: { domainId: domain },
  });
  if (!row) return null;
  return {
    domainId: domain,
    killSwitch: row.killSwitch as KillSwitchPosition,
    mode: row.mode as FullAutopilotMode,
    changedBy: row.lastChangedById,
    changedAt: row.updatedAt,
    reason: row.lastReason,
  };
}

export async function setDomainKillSwitch(params: {
  domain: LecipmAutopilotDomainId;
  position: KillSwitchPosition;
  actorUserId: string;
  reason: string;
}): Promise<void> {
  await prisma.lecipmFullAutopilotDomainConfig.upsert({
    where: { domainId: params.domain },
    create: {
      domainId: params.domain,
      killSwitch: params.position,
      mode: "ASSIST",
      lastChangedById: params.actorUserId,
      lastReason: params.reason.slice(0, 8000),
    },
    update: {
      killSwitch: params.position,
      lastChangedById: params.actorUserId,
      lastReason: params.reason.slice(0, 8000),
    },
  });
}
