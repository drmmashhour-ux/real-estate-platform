import type { SimulationRunContext, SimulationScenarioResult } from "@/modules/e2e-simulation/e2e-simulation.types";
import { apiUrl, fetchEvidence } from "@/modules/e2e-simulation/http-simulation";
import { finalizeScenario } from "@/modules/e2e-simulation/scenario-helpers";
import { runStripeBookingE2e } from "@/modules/launch/stripe-booking-e2e.engine";

export async function runPaymentSimulation(ctx: SimulationRunContext): Promise<SimulationScenarioResult> {
  const steps = [];

  const ready = await fetchEvidence(apiUrl(ctx, "/api/ready"), { method: "GET" });
  steps.push({
    stepId: "pay-1",
    title: "API ready before payment checks",
    status: ready.ok ? ("PASS" as const) : ("FAIL" as const),
    details: `HTTP ${ready.status}`,
    routeOrService: "/api/ready",
    evidence: ready.snippet,
    frictionPoints: [],
    blockers: ready.status >= 500 ? ["unhealthy"] : [],
  });

  const co = await fetchEvidence(apiUrl(ctx, "/api/stripe/checkout"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      paymentType: "booking",
      bookingId: "00000000-0000-0000-0000-000000000000",
      successUrl: "https://example.com/ok",
      cancelUrl: "https://example.com/cancel",
      amountCents: 100,
    }),
  });
  steps.push({
    stepId: "pay-2",
    title: "Booking checkout requires session (401/403)",
    status: co.status === 401 || co.status === 403 ? ("PASS" as const) : co.status < 500 ? ("WARNING" as const) : ("FAIL" as const),
    details: `HTTP ${co.status}`,
    routeOrService: "/api/stripe/checkout",
    evidence: co.snippet,
    frictionPoints: [],
    blockers: co.status >= 500 ? ["checkout 5xx"] : [],
  });

  if (ctx.executeLiveStripeBooking) {
    const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
    const wh = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
    if (!sk.startsWith("sk_test_") || !wh.startsWith("whsec_")) {
      steps.push({
        stepId: "pay-3-env",
        title: "Live Stripe E2E skipped — missing sk_test or whsec",
        status: "NOT_CONFIRMED" as const,
        details: "Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET for test-mode execution",
        routeOrService: "modules/launch/stripe-booking-e2e.engine",
        evidence: "env incomplete",
        frictionPoints: [],
        blockers: [],
      });
    } else {
      const e2e = await runStripeBookingE2e({
        baseUrl: ctx.baseUrl,
        testDuplicateWebhook: true,
        skipCleanup: false,
      });
      for (const s of e2e.steps) {
        steps.push({
          stepId: `pay-live-${s.name}`,
          title: `Stripe E2E: ${s.name}`,
          status: s.ok ? ("PASS" as const) : ("FAIL" as const),
          details: s.detail ?? "",
          routeOrService: "stripe-booking-e2e.engine",
          evidence: s.ok ? "ok" : (s.detail ?? "fail"),
          frictionPoints: [],
          blockers: s.ok ? [] : [s.detail ?? s.name],
        });
      }
      if (!e2e.success) {
        steps.push({
          stepId: "pay-live-summary",
          title: "Stripe booking E2E aggregate",
          status: "FAIL" as const,
          details: e2e.errors.join("; ") || "failed",
          routeOrService: "runStripeBookingE2e",
          evidence: JSON.stringify({ errors: e2e.errors }),
          frictionPoints: [],
          blockers: e2e.errors,
        });
      } else {
        steps.push({
          stepId: "pay-live-summary",
          title: "Stripe booking E2E aggregate",
          status: "PASS" as const,
          details: `duplicateDetected=${e2e.duplicateDetected}`,
          routeOrService: "runStripeBookingE2e",
          evidence: "success",
          frictionPoints: [],
          blockers: [],
        });
      }
    }
  } else {
    steps.push({
      stepId: "pay-3-skip",
      title: "Live Stripe + webhook + DB proof not executed (flag off)",
      status: "NOT_CONFIRMED" as const,
      details: "Set executeLiveStripeBooking or run CLI with LAUNCH_VALIDATION_RUN_STRIPE_E2E=1",
      routeOrService: "runStripeBookingE2e",
      evidence: "skipped",
      frictionPoints: [],
      blockers: [],
    });
  }

  return finalizeScenario({
    scenarioId: "payment-v1",
    scenarioName: "Payment / Stripe Flow",
    domain: "payments",
    steps,
    recommendations: [
      "Run `pnpm run launch:e2e:stripe-booking` with Next + DB for mandatory payment proof.",
    ],
  });
}
