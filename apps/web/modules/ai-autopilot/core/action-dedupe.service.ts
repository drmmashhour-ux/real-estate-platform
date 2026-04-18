import type { PlatformAutopilotActionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Merge targets only — excludes `approved` so completed work is not endlessly refreshed. */
const ACTIVE_STATUSES: PlatformAutopilotActionStatus[] = ["detected", "recommended", "pending_approval"];

/**
 * Returns an existing active row with the same fingerprint, if any.
 */
export async function findActiveDuplicate(fingerprint: string) {
  if (!fingerprint) return null;
  return prisma.platformAutopilotAction.findFirst({
    where: {
      fingerprint,
      status: { in: ACTIVE_STATUSES },
    },
    orderBy: { updatedAt: "desc" },
  });
}
