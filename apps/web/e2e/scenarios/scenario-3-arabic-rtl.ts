import { expect } from "@playwright/test";
import type { ScenarioContext, ScenarioResult } from "./_context";
import { e2eScenarioStart, e2eStep } from "./_log";
import { dismissCommonOverlays } from "../helpers/overlays";
import { trackGrowthEvent } from "../utils/api";
import { statusForThrown } from "../utils/infra";
import { E2E_SEED } from "../utils/data";

export async function scenario3ArabicRtl(ctx: ScenarioContext): Promise<ScenarioResult> {
  const failed: string[] = [];
  const bugs: string[] = [];
  const name = "Scenario 3 — Arabic RTL flow";

  try {
    e2eScenarioStart(3, name);
    e2eStep("s3_set_locale_cookie_ar");
    await ctx.page.context().addCookies([
      { name: "mi_locale", value: "ar", url: ctx.origin },
    ]);
    await trackGrowthEvent(ctx.page, ctx.origin, {
      event: "language_switched",
      locale: "ar",
      path: "/",
    });

    e2eStep("s3_homepage");
    await ctx.page.goto(`${ctx.origin}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await dismissCommonOverlays(ctx.page);
    const dir = await ctx.page.locator("html").getAttribute("dir");
    e2eStep("s3_html_dir", { dir });
    if (dir !== "rtl") {
      failed.push(`expected html dir=rtl, got ${dir}`);
    }

    e2eStep("s3_browse_bnhub");
    await ctx.page.goto(`${ctx.origin}/bnhub/stays`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await dismissCommonOverlays(ctx.page);
    await expect(ctx.page.locator("body")).toBeVisible();

    e2eStep("s3_listing_detail");
    await ctx.page.goto(`${ctx.origin}/bnhub/listings/${E2E_SEED.listingId}`, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await dismissCommonOverlays(ctx.page);
    const bodyW = await ctx.page.evaluate(() => document.body.scrollWidth);
    const winW = await ctx.page.evaluate(() => window.innerWidth);
    if (bodyW > winW + 80) {
      failed.push(`possible horizontal overflow bodyW=${bodyW} winW=${winW}`);
    }

    return {
      id: 3,
      name,
      status: failed.length ? "FAIL" : "PASS",
      detail: failed.length ? failed.join("; ") : "AR locale + RTL + listing render",
      failedSteps: failed,
      criticalBugs: bugs,
    };
  } catch (e) {
    const { status, msg } = statusForThrown(e);
    if (status === "FAIL") bugs.push(msg);
    return { id: 3, name, status, detail: msg, failedSteps: [...failed, msg], criticalBugs: bugs };
  }
}
