import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { UserSimulationReport } from "@/modules/simulation/user-simulation.types";

export function resolveSimulationReportPath(): string {
  const override = process.env.LECIPM_SIMULATION_REPORT_PATH?.trim();
  if (override) return override;
  return join(process.cwd(), "..", "..", "tests", "reports", "ux-simulation-report.json");
}

export function writeUserSimulationReport(report: UserSimulationReport, path = resolveSimulationReportPath()): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(report, null, 2), "utf8");
}
