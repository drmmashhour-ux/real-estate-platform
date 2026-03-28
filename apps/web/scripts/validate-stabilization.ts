/**
 * Self-check: stabilization modules + report shape.
 */
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { runFullStabilization, classifyProductionReadiness } from "../src/modules/stabilization/stabilizationReport";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");

const REQUIRED_MODULES = [
  "src/modules/stabilization/types.ts",
  "src/modules/stabilization/fileScanner.ts",
  "src/modules/stabilization/fsUtils.ts",
  "src/modules/stabilization/importAudit.ts",
  "src/modules/stabilization/routeAudit.ts",
  "src/modules/stabilization/featureFlagAudit.ts",
  "src/modules/stabilization/envAudit.ts",
  "src/modules/stabilization/apiAudit.ts",
  "src/modules/stabilization/dataFlowAudit.ts",
  "src/modules/stabilization/uiAudit.ts",
  "src/modules/stabilization/errorAudit.ts",
  "src/modules/stabilization/performanceAudit.ts",
  "src/modules/stabilization/securityAudit.ts",
  "src/modules/stabilization/stabilizationReport.ts",
  "scripts/run-stabilization.ts",
] as const;

function main(): void {
  const issues: string[] = [];

  for (const rel of REQUIRED_MODULES) {
    const p = join(WEB_ROOT, rel);
    if (!existsSync(p)) issues.push(`missing ${rel}`);
  }

  const pkgPath = join(WEB_ROOT, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { scripts?: Record<string, string> };
  if (!pkg.scripts?.stabilize) issues.push("package.json missing script: stabilize");

  const mini = runFullStabilization(WEB_ROOT);
  if (!mini.audits?.length) issues.push("runFullStabilization returned no audits");
  if (typeof mini.productionReady !== "boolean") issues.push("report missing productionReady");

  const flat = mini.audits.flatMap((a) => a.issues);
  const cls = classifyProductionReadiness(mini.audits, flat);
  if (typeof cls.criticalCount !== "number") issues.push("classifyProductionReadiness broken");

  const tmp = join(WEB_ROOT, ".stabilization-validate-tmp.json");
  writeFileSync(tmp, JSON.stringify(mini, null, 2));
  if (!existsSync(tmp)) issues.push("could not write temp report");
  else unlinkSync(tmp);

  if (issues.length) {
    console.error("ISSUES:\n", issues.join("\n"));
    process.exit(1);
  }

  console.log("Modules: OK");
  console.log("CLI script: OK");
  console.log("Sample classification: criticalCount=%s productionReady=%s", cls.criticalCount, cls.productionReady);
  console.log("Report path (when run): %s", join(WEB_ROOT, ".stabilization-report.json"));
  console.log("\nLECIPM STABILIZATION SYSTEM ACTIVE");
}

main();
