import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logWarn } from "@/lib/logger";

let warnedOrchestratedPayment = false;
let warnedOrchestratedPayout = false;

/**
 * Next.js dev can keep a global PrismaClient singleton from before orchestration models
 * existed, or `@prisma/client` can be stale until `pnpm exec prisma generate` + dev restart.
 */
export function getOrchestratedPaymentDelegate(): PrismaClient["orchestratedPayment"] | undefined {
  const d = (prisma as unknown as { orchestratedPayment?: PrismaClient["orchestratedPayment"] })
    .orchestratedPayment;
  if (!d && !warnedOrchestratedPayment) {
    warnedOrchestratedPayment = true;
    logWarn(
      "[admin] prisma.orchestratedPayment missing — run `pnpm exec prisma generate` in apps/web, then restart `pnpm dev`.",
    );
  }
  return d;
}

export function getOrchestratedPayoutDelegate(): PrismaClient["orchestratedPayout"] | undefined {
  const d = (prisma as unknown as { orchestratedPayout?: PrismaClient["orchestratedPayout"] })
    .orchestratedPayout;
  if (!d && !warnedOrchestratedPayout) {
    warnedOrchestratedPayout = true;
    logWarn(
      "[admin] prisma.orchestratedPayout missing — run `pnpm exec prisma generate` in apps/web, then restart `pnpm dev`.",
    );
  }
  return d;
}
