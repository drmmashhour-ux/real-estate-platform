import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { FinalLaunchReportV1 } from "./final-launch-report.types";

export function getFinalLaunchReportPath(): string {
  return join(process.cwd(), "tests", "reports", "FINAL_LAUNCH_REPORT.json");
}

export function writeFinalLaunchReport(report: FinalLaunchReportV1): string {
  const path = getFinalLaunchReportPath();
  mkdirSync(join(process.cwd(), "tests", "reports"), { recursive: true });
  writeFileSync(path, JSON.stringify(report, null, 2), "utf8");
  return path;
}
