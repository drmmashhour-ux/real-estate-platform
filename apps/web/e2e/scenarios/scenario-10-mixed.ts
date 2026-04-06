import type { ScenarioContext, ScenarioResult } from "./_context";
import { e2eScenarioStart, e2eStep } from "./_log";
import { trackGrowthEvent } from "../utils/api";
import { statusForThrown } from "../utils/infra";
import { getMarketSettingsAdmin, patchMarketSettingsAdmin, type MarketSettingsPayload } from "./_market-api";
import { lecipmLogin } from "./_session";

export async function scenario10Mixed(ctx: ScenarioContext): Promise<ScenarioResult> {
  const failed: string[] = [];
  const bugs: string[] = [];
  const name = "Scenario 10 — mixed market / locale adaptation";

  const adminEmail = process.env.E2E_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.E2E_ADMIN_PASSWORD?.trim();
  if (!adminEmail || !adminPassword) {
    return {
      id: 10,
      name,
      status: "BLOCKED",
      detail: "E2E_ADMIN_* required",
      failedSteps: [],
      criticalBugs: [],
    };
  }

  let previous: MarketSettingsPayload | null = null;

  try {
    e2eScenarioStart(10, name);
    await ctx.page.context().clearCookies();
    await lecipmLogin(ctx.page, adminEmail, adminPassword);
    previous = await getMarketSettingsAdmin(ctx.page.request, ctx.origin);
    if (!previous) {
      return { id: 10, name, status: "FAIL", detail: "market GET", failedSteps: ["get"], criticalBugs: [] };
    }

    e2eStep("s10_flags_default");
    const f1 = await ctx.page.request.get(`${ctx.origin}/api/launch/flags`);
    if (!f1.ok()) failed.push(`launch flags ${f1.status()}`);

    e2eStep("s10_patch_syria");
    await patchMarketSettingsAdmin(ctx.page.request, ctx.origin, {
      syriaModeEnabled: true,
      onlinePaymentsEnabled: false,
      manualPaymentTrackingEnabled: true,
      activeMarketCode: "syria",
    });
    const mSyria = await getMarketSettingsAdmin(ctx.page.request, ctx.origin);
    if (!mSyria?.onlinePaymentsEnabled) {
      e2eStep("s10_syria_online_disabled", { ok: true });
    } else {
      failed.push("Syria patch did not disable online payments");
    }
    await trackGrowthEvent(ctx.page, ctx.origin, {
      event: "market_mode_used",
      locale: "en",
      metadata: { source: "e2e_s10", market: "syria" },
    });

    await ctx.page.context().addCookies([{ name: "mi_locale", value: "ar", url: ctx.origin }]);
    await trackGrowthEvent(ctx.page, ctx.origin, {
      event: "language_switched",
      locale: "ar",
      path: "/api/launch/flags",
    });
    const f2 = await ctx.page.request.get(`${ctx.origin}/api/launch/flags`);
    if (!f2.ok()) failed.push(`launch flags after ar cookie ${f2.status()}`);

    e2eStep("s10_restore_default_market");
    await patchMarketSettingsAdmin(ctx.page.request, ctx.origin, {
      syriaModeEnabled: Boolean(previous.syriaModeEnabled),
      onlinePaymentsEnabled: Boolean(previous.onlinePaymentsEnabled),
      manualPaymentTrackingEnabled: Boolean(previous.manualPaymentTrackingEnabled),
      contactFirstEmphasis: Boolean(previous.contactFirstEmphasis),
      activeMarketCode:
        typeof previous.activeMarketCode === "string" && previous.activeMarketCode.length > 0
          ? previous.activeMarketCode
          : "default",
    });
    const mBack = await getMarketSettingsAdmin(ctx.page.request, ctx.origin);
    if (mBack?.onlinePaymentsEnabled !== previous.onlinePaymentsEnabled) {
      failed.push("restore did not match previous onlinePaymentsEnabled");
    }

    return {
      id: 10,
      name,
      status: failed.length ? "FAIL" : "PASS",
      detail: "market toggles + launch flags + AR cookie coexist",
      failedSteps: failed,
      criticalBugs: bugs,
    };
  } catch (e) {
    const { status, msg } = statusForThrown(e);
    if (status === "FAIL") bugs.push(msg);
    return { id: 10, name, status, detail: msg, failedSteps: [...failed, msg], criticalBugs: bugs };
  } finally {
    try {
      await ctx.page.context().clearCookies();
      await lecipmLogin(ctx.page, adminEmail, adminPassword);
      if (previous) {
        await patchMarketSettingsAdmin(ctx.page.request, ctx.origin, {
          syriaModeEnabled: Boolean(previous.syriaModeEnabled),
          onlinePaymentsEnabled: Boolean(previous.onlinePaymentsEnabled),
          manualPaymentTrackingEnabled: Boolean(previous.manualPaymentTrackingEnabled),
          contactFirstEmphasis: Boolean(previous.contactFirstEmphasis),
          activeMarketCode:
            typeof previous.activeMarketCode === "string" && previous.activeMarketCode.length > 0
              ? previous.activeMarketCode
              : "default",
        });
      }
    } catch (re) {
      console.warn("[E2E] s10 finally restore", re);
    }
  }
}
