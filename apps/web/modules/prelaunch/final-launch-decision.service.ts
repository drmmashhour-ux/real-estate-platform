/**
 * Phase 13 — aggregate GO / GO_WITH_WARNINGS / NO_GO from sub-reports.
 */
import type { FinalLaunchReportV1 } from "./final-launch-report.types";

export function computeFinalLaunchDecision(report: FinalLaunchReportV1): Pick<FinalLaunchReportV1, "decision" | "blockers" | "warnings"> {
  const blockers: string[] = [];
  const warnings: string[] = [];

  for (const e of report.environment) {
    if (!e.ok && e.severity === "blocking") blockers.push(`env:${e.id}:${e.detail}`);
    if (!e.ok && e.severity === "warning") warnings.push(`env:${e.id}:${e.detail}`);
  }

  for (const b of report.build.blockingFailures) {
    blockers.push(`build:${b}`);
  }
  if (report.build.steps.some((s) => s.step === "build_skipped")) {
    blockers.push("mandatory_build_phase_skipped_PRELAUNCH_SKIP_BUILD");
  }
  for (const s of report.build.steps) {
    if (!s.ok && s.logTail && s.step !== "build_skipped") {
      warnings.push(`build_log:${s.step}`);
    }
  }

  if (report.platformValidation) {
    if (report.platformValidation.launch.decision === "NO_GO") {
      for (const x of report.platformValidation.launch.blockers) blockers.push(`platform:${x}`);
    }
    for (const w of report.platformValidation.launch.warnings) warnings.push(`platform:${w}`);
  } else {
    warnings.push("platform_validation_missing");
  }

  if (report.simulation) {
    if (report.simulation.decision === "NO_GO") {
      blockers.push("simulation:NO_GO");
    }
    for (const w of report.simulation.warnings ?? []) warnings.push(`simulation:${w}`);
    for (const c of report.simulation.criticalBlockers ?? []) blockers.push(`simulation_critical:${c}`);
  }

  for (const g of report.growthApis) {
    if (!g.ok) warnings.push(`growth_api:${g.name}:${g.detail}`);
  }

  if (report.performance.homepageWarn) warnings.push(report.performance.homepageWarn);
  if (report.performance.apiReadyWarn) warnings.push(report.performance.apiReadyWarn);

  let decision: FinalLaunchReportV1["decision"] = "GO";
  if (blockers.length) decision = "NO_GO";
  else if (warnings.length) decision = "GO_WITH_WARNINGS";

  return { decision, blockers, warnings };
}
