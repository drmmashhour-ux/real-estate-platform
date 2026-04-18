import type { AutopilotMode } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function upsertPolicy(opts: {
  scopeType: string;
  scopeId: string;
  mode: AutopilotMode;
  allowedDomains?: unknown[];
  blockedActions?: unknown[];
}) {
  return prisma.platformAutopilotPolicy.upsert({
    where: { scopeType_scopeId: { scopeType: opts.scopeType, scopeId: opts.scopeId } },
    create: {
      scopeType: opts.scopeType,
      scopeId: opts.scopeId,
      mode: opts.mode,
      allowedDomains: (opts.allowedDomains ?? []) as object[],
      blockedActions: (opts.blockedActions ?? []) as object[],
    },
    update: {
      mode: opts.mode,
      ...(opts.allowedDomains != null ? { allowedDomains: opts.allowedDomains as object[] } : {}),
      ...(opts.blockedActions != null ? { blockedActions: opts.blockedActions as object[] } : {}),
    },
  });
}

export async function getPolicy(scopeType: string, scopeId: string) {
  return prisma.platformAutopilotPolicy.findUnique({
    where: { scopeType_scopeId: { scopeType, scopeId } },
  });
}
