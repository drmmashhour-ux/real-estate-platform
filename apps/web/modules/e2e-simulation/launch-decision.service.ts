import type { SimulationScenarioResult, UnifiedPlatformSimulationReport } from "./e2e-simulation.types";

const CRITICAL_DOMAINS = new Set([
  "payments",
  "bnhub_guest",
  "broker",
  "failure_edge",
  "browser_e2e",
]);

/**
 * NO_GO if any critical domain FAIL, or payments NOT_CONFIRMED when live Stripe was requested but not completed.
 * GO_WITH_WARNINGS if no FAIL but any WARNING or NOT_CONFIRMED in non-payment domains.
 */
export function computeLaunchDecision(report: UnifiedPlatformSimulationReport): UnifiedPlatformSimulationReport["decision"] {
  const scenarios = report.scenarios;
  const fail = scenarios.filter((s) => s.status === "FAIL");
  if (fail.some((s) => CRITICAL_DOMAINS.has(s.domain))) {
    return "NO_GO";
  }
  if (fail.length > 0) {
    return "NO_GO";
  }

  const browser = scenarios.find((s) => s.domain === "browser_e2e");
  if (process.env.E2E_REQUIRE_BROWSER_FULL === "1" && browser && browser.status !== "PASS") {
    return "NO_GO";
  }

  const pay = scenarios.find((s) => s.domain === "payments");
  if (
    report.context.executeLiveStripeBooking &&
    pay &&
    (pay.status === "NOT_CONFIRMED" || pay.status === "FAIL")
  ) {
    return "NO_GO";
  }

  const anyWarn = scenarios.some((s) => s.status === "WARNING");
  const anyNc = scenarios.some((s) => s.status === "NOT_CONFIRMED");
  if (anyWarn || anyNc) {
    return "GO_WITH_WARNINGS";
  }
  return "GO";
}

export function extractCriticalBlockers(scenarios: SimulationScenarioResult[]): string[] {
  const out: string[] = [];
  for (const s of scenarios) {
    if (s.status !== "FAIL") continue;
    for (const st of s.steps) {
      if (st.status === "FAIL") {
        out.push(`[${s.domain}] ${st.title}: ${st.details}`);
      }
      out.push(...st.blockers);
    }
  }
  return [...new Set(out)].slice(0, 80);
}

export function extractWarnings(scenarios: SimulationScenarioResult[]): string[] {
  const out: string[] = [];
  for (const s of scenarios) {
    if (s.status === "WARNING" || s.status === "NOT_CONFIRMED") {
      out.push(`${s.domain}: ${s.summary}`);
    }
    for (const st of s.steps) {
      if (st.status === "WARNING" || st.status === "NOT_CONFIRMED") {
        out.push(`[${s.domain}] ${st.title}: ${st.details}`);
      }
    }
  }
  return [...new Set(out)].slice(0, 120);
}
