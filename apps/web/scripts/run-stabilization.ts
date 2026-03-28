/**
 * Full stabilization pass — non-destructive audits, JSON + console output.
 * Run from repo root or apps/web (web root auto-detected).
 */
import { resolveWebRoot } from "../src/modules/stabilization/fsUtils";
import {
  runFullStabilization,
  writeStabilizationReportJson,
  printConsoleSummary,
} from "../src/modules/stabilization/stabilizationReport";

const webRoot = resolveWebRoot();
const report = runFullStabilization(webRoot);
const outPath = writeStabilizationReportJson(webRoot, report);
printConsoleSummary(report);

console.log(`\nReport written: ${outPath}\n`);

if (report.productionReady) {
  console.log("LECIPM STABILIZATION PASS COMPLETE");
  process.exit(0);
}

console.error("LECIPM NOT READY FOR PRODUCTION");
console.error("Blockers:", report.readinessBlockers?.join("\n  • ") ?? "(see report)");
process.exit(1);
