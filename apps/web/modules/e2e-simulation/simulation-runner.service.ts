import type { SimulationRunContext, SimulationScenarioResult } from "./e2e-simulation.types";
import { runPlaywrightBrowserSimulation } from "./playwright-browser.service";
import { runBnhubGuestSimulation } from "../../tests/scenarios/bnhub-guest-flow";
import { runBnhubHostSimulation } from "../../tests/scenarios/bnhub-host-flow";
import { runBrokerSimulation } from "../../tests/scenarios/broker-flow";
import { runAdminSimulation } from "../../tests/scenarios/admin-flow";
import { runFounderSimulation } from "../../tests/scenarios/founder-flow";
import { runAiSystemsSimulation } from "../../tests/scenarios/ai-systems-flow";
import { runPaymentSimulation } from "../../tests/scenarios/payment-flow";
import { runFailureEdgeSimulation } from "../../tests/scenarios/failure-flow";
import { runMobileBrokerServiceSimulation } from "../../tests/scenarios/mobile-broker-flow";
import type { SimulationStepResult } from "./e2e-simulation.types";
import { scenarioRollup } from "./simulation-status.service";

function mapMobileToScenario(mob: Awaited<ReturnType<typeof runMobileBrokerServiceSimulation>>): SimulationScenarioResult {
  const steps: SimulationStepResult[] = mob.steps.map((s, i) => ({
    stepId: s.stepId || `mb-${i}`,
    title: s.title,
    status: s.status,
    details: s.details,
    routeOrService: "apps/mobile",
    evidence: s.evidence,
    frictionPoints: s.status === "NOT_CONFIRMED" ? ["runtime not exercised"] : [],
    blockers: s.status === "FAIL" ? [s.details] : [],
  }));
  return scenarioRollup({
    scenarioId: "mobile-broker-v1",
    scenarioName: mob.scenarioName,
    domain: "mobile_broker",
    steps,
    recommendations: [
      "Run Expo app against staging with broker_test_user for true mobile validation.",
    ],
  });
}

/**
 * Executes scenarios in the required platform order (Phase 0).
 */
export async function runOrderedPlatformSimulations(ctx: SimulationRunContext): Promise<SimulationScenarioResult[]> {
  const out: SimulationScenarioResult[] = [];

  out.push(await runBnhubGuestSimulation(ctx));
  out.push(await runBnhubHostSimulation(ctx));
  out.push(await runBrokerSimulation(ctx));
  out.push(await runAdminSimulation(ctx));
  out.push(await runFounderSimulation(ctx));

  out.push(mapMobileToScenario(await runMobileBrokerServiceSimulation()));

  out.push(await runAiSystemsSimulation(ctx));
  out.push(await runPaymentSimulation(ctx));
  out.push(await runFailureEdgeSimulation(ctx));

  const browserE2e = await runPlaywrightBrowserSimulation(ctx);
  out.push(browserE2e.scenario);

  return out;
}
