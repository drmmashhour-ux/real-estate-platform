import { prisma } from "@/lib/db";

import { normalizePersistedMode } from "./autopilot-domain-matrix.service";
import { getDomainMatrixRow } from "./autopilot-domain-matrix.service";
import type { FullAutopilotMode } from "./autopilot-domain-matrix.types";
import type { LecipmAutopilotDomainId } from "./autopilot-domain-matrix.types";

export async function getEffectiveDomainMode(domain: LecipmAutopilotDomainId): Promise<FullAutopilotMode> {
  const row = await prisma.lecipmFullAutopilotDomainConfig.findUnique({
    where: { domainId: domain },
  });
  const def = getDomainMatrixRow(domain)?.defaultMode ?? "ASSIST";
  return normalizePersistedMode(row?.mode ?? def);
}

export async function setDomainMode(params: {
  domain: LecipmAutopilotDomainId;
  mode: FullAutopilotMode;
  actorUserId: string;
  reason: string;
}): Promise<void> {
  await prisma.lecipmFullAutopilotDomainConfig.upsert({
    where: { domainId: params.domain },
    create: {
      domainId: params.domain,
      mode: params.mode,
      killSwitch: "ON",
      lastChangedById: params.actorUserId,
      lastReason: params.reason.slice(0, 8000),
    },
    update: {
      mode: params.mode,
      lastChangedById: params.actorUserId,
      lastReason: params.reason.slice(0, 8000),
    },
  });
}
