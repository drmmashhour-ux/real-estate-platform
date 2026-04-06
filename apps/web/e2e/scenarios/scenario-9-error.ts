import type { ScenarioContext, ScenarioResult } from "./_context";
import { e2eScenarioStart, e2eStep } from "./_log";
import { simulateStripeFailure } from "../utils/api";
import { statusForThrown } from "../utils/infra";

export async function scenario9Error(ctx: ScenarioContext): Promise<ScenarioResult> {
  const failed: string[] = [];
  const bugs: string[] = [];
  const name = "Scenario 9 — error recovery (bad Stripe webhook)";

  try {
    e2eScenarioStart(9, name);
    e2eStep("s9_simulate_stripe_failure");
    const { webhookStatus, checkoutStatus } = await simulateStripeFailure(ctx.page.request, ctx.origin);
    e2eStep("s9_webhook_http_status", { status: webhookStatus });
    if (webhookStatus >= 200 && webhookStatus < 300) {
      failed.push(`expected non-2xx from invalid webhook signature, got ${webhookStatus}`);
    }

    e2eStep("s9_checkout_empty_status", { status: checkoutStatus });
    if (checkoutStatus >= 200 && checkoutStatus < 300) {
      failed.push(`empty checkout body returned success HTTP ${checkoutStatus}`);
    }

    return {
      id: 9,
      name,
      status: failed.length ? "FAIL" : "PASS",
      detail: "invalid webhook + empty checkout rejected at HTTP layer",
      failedSteps: failed,
      criticalBugs: bugs,
    };
  } catch (e) {
    const { status, msg } = statusForThrown(e);
    if (status === "FAIL") bugs.push(msg);
    return { id: 9, name, status, detail: msg, failedSteps: [...failed, msg], criticalBugs: bugs };
  }
}
