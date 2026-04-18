/**
 * Launch decision engine — strict: failures surface as NO_GO.
 */
import type { ApiCheckResult, LaunchDecisionReport, PageValidationResult, PlatformValidationReportV1, ScenarioResult, SecurityCheckResult } from "./types";

function criticalPages(): string[] {
  return [
    "/en/ca",
    "/en/ca/listings",
    "/en/ca/bnhub",
    "/en/ca/search",
  ];
}

export function decideLaunch(report: PlatformValidationReportV1): LaunchDecisionReport {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const reasons: string[] = [];

  if (!report.launchEvents.ran) {
    if (report.meta.mode === "offline") {
      warnings.push("launch_events_not_checked_offline_or_no_database");
    } else {
      blockers.push("launch_events_gate_not_run:set_DATABASE_URL_and_seed_launch_events");
    }
  } else if (!report.launchEvents.ready) {
    for (const i of report.launchEvents.issues) blockers.push(`launch_events:${i}`);
  } else {
    reasons.push("launch_events_counts_ok");
  }

  for (const p of report.pages) {
    if (p.status === "fail") {
      blockers.push(`page:${p.route}:${p.errors.join(";")}`);
    }
    if (p.warnings.length) warnings.push(`page:${p.route}:${p.warnings.join(";")}`);
  }

  for (const id of criticalPages()) {
    const hit = report.pages.find((p) => p.route === id);
    if (hit && hit.status === "fail") {
      blockers.push(`critical_page_broken:${id}`);
    }
  }

  for (const a of report.apis) {
    if (a.status === "fail") blockers.push(`api:${a.name}:${a.errors.join(";")}`);
    if (a.warnings.length) warnings.push(`api:${a.name}`);
  }

  for (const s of report.security) {
    if (s.status === "fail") blockers.push(`security:${s.name}:${s.errors.join(";")}`);
    if (s.warnings.length) warnings.push(`security:${s.name}:${s.warnings.join(";")}`);
  }

  for (const sc of report.scenarios) {
    if (sc.status === "fail") blockers.push(`scenario:${sc.id}`);
    for (const w of sc.warnings) warnings.push(`scenario:${sc.id}:${w}`);
  }

  if (report.stripeBooking.ran && !report.stripeBooking.ok) {
    blockers.push(`stripe_booking:${report.stripeBooking.detail ?? "failed"}`);
  }

  if (report.dataIntegrity.ran && !report.dataIntegrity.ok) {
    const issues = report.dataIntegrity.issues;
    const onlySupabaseConfig = issues.length > 0 && issues.every((i) => i.includes("SUPABASE_UNAVAILABLE"));
    if (onlySupabaseConfig) {
      warnings.push("data_integrity:supabase_not_configured_skipped");
    } else {
      for (const i of issues) blockers.push(`data_integrity:${i}`);
    }
  }

  for (const w of report.performance.slowWarnings) warnings.push(w);

  let decision: LaunchDecisionReport["decision"] = "GO";
  if (blockers.length) {
    decision = "NO_GO";
  } else if (warnings.length) {
    decision = "GO_WITH_WARNINGS";
  }

  return { decision, reasons, blockers, warnings };
}
