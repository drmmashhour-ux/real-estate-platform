import { join } from "node:path";
import { runDrBrainForApp } from "@repo/drbrain";
import type { DrBrainReport } from "@repo/drbrain";
import { getLegacyDB } from "@/lib/db/legacy";

function monorepoRoot(): string {
  return process.env.DRBRAIN_MONOREPO_ROOT?.trim() || join(process.cwd(), "..", "..");
}

/**
 * DR.BRAIN health run for LECIPM (`apps/web`). Uses only web Prisma — never imports other apps.
 */
export async function runWebDrBrainReport(): Promise<DrBrainReport> {
  const skipBuild = process.env.DRBRAIN_INCLUDE_BUILD?.trim().toLowerCase() !== "true";

  return runDrBrainForApp({
    appId: "lecipm",
    env: { ...process.env },
    dbPing: async () => {
      const prisma = getLegacyDB();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    },
    flags: { skipPayments: true, skipBuild },
    workspacePaths: { monorepoRoot: monorepoRoot(), appRelativeDir: "apps/web" },
  });
}
