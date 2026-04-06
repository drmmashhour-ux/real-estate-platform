import { expect } from "@playwright/test";
import type { ScenarioContext, ScenarioResult } from "./_context";
import { e2eScenarioStart, e2eStep } from "./_log";
import { dismissCommonOverlays } from "../helpers/overlays";
import { E2E_SEED } from "../utils/data";
import { statusForThrown } from "../utils/infra";
import { trackGrowthEvent } from "../utils/api";
import { runBnhubStripePaidSimulation } from "./lib/bnhub-stripe-paid-flow";

export async function scenario1OnlineBooking(ctx: ScenarioContext): Promise<ScenarioResult> {
  const failed: string[] = [];
  const bugs: string[] = [];
  const name = "Scenario 1 — standard online booking (EN)";

  try {
    e2eScenarioStart(1, name);
    e2eStep("s1_homepage_en");
    await ctx.page.goto(`${ctx.origin}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await dismissCommonOverlays(ctx.page);
    await expect(ctx.page.locator("html")).toHaveAttribute("lang", /./);

    e2eStep("s1_browse_listings");
    await ctx.page.goto(`${ctx.origin}/bnhub/stays`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await dismissCommonOverlays(ctx.page);
    await expect(ctx.page.locator("body")).toBeVisible();
    await trackGrowthEvent(ctx.page, ctx.origin, {
      event: "listings_browse_viewed",
      locale: "en",
      path: "/bnhub/stays",
    });

    e2eStep("s1_open_listing");
    await ctx.page.goto(`${ctx.origin}/bnhub/listings/${E2E_SEED.listingId}`, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await dismissCommonOverlays(ctx.page);
    await expect(ctx.page.locator("body")).toBeVisible();
    await trackGrowthEvent(ctx.page, ctx.origin, {
      event: "listing_viewed",
      locale: "en",
      listingId: E2E_SEED.listingId,
      path: `/bnhub/listings/${E2E_SEED.listingId}`,
    });

    const runId = `s1-${Date.now()}`;
    const sim = await runBnhubStripePaidSimulation(runId);
    if (!sim.ok) {
      failed.push(`stripe_simulation: ${sim.reason}`);
      return {
        id: 1,
        name,
        status: "BLOCKED",
        detail: sim.reason,
        failedSteps: failed,
        criticalBugs: bugs,
      };
    }

    ctx.state.stripePaidFlowOk = true;
    e2eStep("s1_stripe_path_verified", { bookingId: sim.bookingId });

    return {
      id: 1,
      name,
      status: "PASS",
      detail: `Stripe session ${sim.sessionId}; DB confirmed before cleanup.`,
      failedSteps: failed,
      criticalBugs: bugs,
    };
  } catch (e) {
    const { status, msg } = statusForThrown(e);
    failed.push(msg);
    if (status === "FAIL") bugs.push(msg);
    return { id: 1, name, status, detail: msg, failedSteps: failed, criticalBugs: bugs };
  }
}
