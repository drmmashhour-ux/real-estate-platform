import { join } from "node:path";
import { runDrBrainForApp } from "@repo/drbrain";
import type { DrBrainReport } from "@repo/drbrain";

function monorepoRoot(): string {
  return process.env.DRBRAIN_MONOREPO_ROOT?.trim() || join(process.cwd(), "..", "..");
}

/**
 * Future HadiaLink DR.BRAIN entry — isolated env snapshot only (no shared DB clients yet).
 */
export async function runHadialinkDrBrainReport(): Promise<DrBrainReport> {
  const skipBuild = process.env.DRBRAIN_INCLUDE_BUILD?.trim().toLowerCase() !== "true";

  return runDrBrainForApp({
    appId: "hadialink",
    env: { ...process.env },
    flags: { skipPayments: true, skipBuild },
    workspacePaths: { monorepoRoot: monorepoRoot(), appRelativeDir: "apps/hadialink" },
  });
}
