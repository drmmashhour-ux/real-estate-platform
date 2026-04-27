/**
 * Monorepo DR.BRAIN orchestrator — loads each app's env independently (never prints DATABASE_URL).
 * Exit 1 if any app report is CRITICAL (optional DRBRAIN_FAIL_ON_WARNING=true).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runDrBrainForApp } from "@repo/drbrain";
import type { DrBrainReport } from "@repo/drbrain";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..");

function parseEnvFile(filePath: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(filePath)) return out;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx < 1) continue;
    const k = t.slice(0, idx).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) continue;
    let v = t.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function mergeAppEnv(appRelativeDir: string): Record<string, string | undefined> {
  const base = join(repoRoot, appRelativeDir);
  const merged: Record<string, string | undefined> = { ...process.env };
  for (const name of [".env.local", ".env"] as const) {
    const parsed = parseEnvFile(join(base, name));
    Object.assign(merged, parsed);
  }
  return merged;
}

function pingViaTestDb(appRelativeDir: string, env: Record<string, string | undefined>): () => Promise<boolean> {
  return async () => {
    const cwd = join(repoRoot, appRelativeDir);
    const r = spawnSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["run", "test-db"], {
      cwd,
      env: { ...process.env, ...env },
      encoding: "utf8",
      shell: false,
    });
    return r.status === 0;
  };
}

function includeBuildFlag(): boolean {
  const v = process.env.DRBRAIN_INCLUDE_BUILD?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

async function run(): Promise<void> {
  const rows: { app: string; status: DrBrainReport["status"]; criticalChecks: number }[] = [];
  const reports: DrBrainReport[] = [];

  const failOnWarning = process.env.DRBRAIN_FAIL_ON_WARNING === "true";

  const skipBuild = !includeBuildFlag();

  const webEnv = mergeAppEnv("apps/web");
  const webReport = await runDrBrainForApp({
    appId: "lecipm",
    env: webEnv,
    dbPing: pingViaTestDb("apps/web", webEnv),
    flags: { skipPayments: true, skipPerformance: false, skipBuild },
    workspacePaths: { monorepoRoot: repoRoot, appRelativeDir: "apps/web" },
  });
  reports.push(webReport);
  rows.push({
    app: "lecipm (apps/web)",
    status: webReport.status,
    criticalChecks: webReport.results.filter((x) => x.level === "CRITICAL").length,
  });

  const syEnv = mergeAppEnv("apps/syria");
  const syReport = await runDrBrainForApp({
    appId: "syria",
    env: syEnv,
    dbPing: pingViaTestDb("apps/syria", syEnv),
    flags: { skipPayments: false, skipBuild },
    workspacePaths: { monorepoRoot: repoRoot, appRelativeDir: "apps/syria" },
  });
  reports.push(syReport);
  rows.push({
    app: "syria",
    status: syReport.status,
    criticalChecks: syReport.results.filter((x) => x.level === "CRITICAL").length,
  });

  const hadialinkPkg = join(repoRoot, "apps/hadialink/package.json");
  if (existsSync(hadialinkPkg)) {
    const haEnv = mergeAppEnv("apps/hadialink");
    if (!haEnv.DATABASE_URL?.trim()) {
      console.warn("[DR.BRAIN] Skipping HadiaLink — DATABASE_URL not set for apps/hadialink (stub workspace).");
    } else {
      const haReport = await runDrBrainForApp({
        appId: "hadialink",
        env: haEnv,
        flags: { skipPayments: true, skipBuild },
        workspacePaths: { monorepoRoot: repoRoot, appRelativeDir: "apps/hadialink" },
      });
      reports.push(haReport);
      rows.push({
        app: "hadialink",
        status: haReport.status,
        criticalChecks: haReport.results.filter((x) => x.level === "CRITICAL").length,
      });
    }
  }

  console.log("\n=== DR.BRAIN summary ===\n");
  console.table(rows);

  const hasCritical = reports.some((r) => r.status === "CRITICAL");
  const hasWarning = reports.some((r) => r.status === "WARNING");

  if (hasCritical) {
    console.error("\n❌ DR.BRAIN: CRITICAL findings — exiting with code 1.\n");
    process.exit(1);
  }
  if (failOnWarning && hasWarning) {
    console.error("\n❌ DR.BRAIN: WARNING findings (DRBRAIN_FAIL_ON_WARNING=true) — exiting with code 1.\n");
    process.exit(1);
  }

  console.log("\n✅ DR.BRAIN: no CRITICAL findings.\n");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
