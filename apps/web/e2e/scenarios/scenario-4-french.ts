import type { ScenarioContext, ScenarioResult } from "./_context";
import { e2eScenarioStart, e2eStep } from "./_log";
import { trackGrowthEvent } from "../utils/api";
import { statusForThrown } from "../utils/infra";
import { dismissCommonOverlays } from "../helpers/overlays";

export async function scenario4French(ctx: ScenarioContext): Promise<ScenarioResult> {
  const failed: string[] = [];
  const bugs: string[] = [];
  const name = "Scenario 4 — French flow";

  try {
    e2eScenarioStart(4, name);
    e2eStep("s4_set_locale_fr");
    await ctx.page.context().addCookies([{ name: "mi_locale", value: "fr", url: ctx.origin }]);
    await trackGrowthEvent(ctx.page, ctx.origin, {
      event: "language_switched",
      locale: "fr",
      path: "/bnhub/stays",
    });

    await ctx.page.goto(`${ctx.origin}/bnhub/stays`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await dismissCommonOverlays(ctx.page);
    const lang = await ctx.page.locator("html").getAttribute("lang");
    e2eStep("s4_html_lang", { lang });
    if (lang && !lang.toLowerCase().startsWith("fr")) {
      failed.push(`expected fr-ish html lang, got ${lang}`);
    }

    const text = await ctx.page.locator("body").innerText();
    const hasFrHints =
      /é|è|ê|à|ù|ô|î|û|ç|propriété|réservation|rechercher|nuit/i.test(text) ||
      /stay|search|book/i.test(text);
    if (!hasFrHints) {
      failed.push("no obvious FR or fallback EN copy detected (soft)");
    }

    return {
      id: 4,
      name,
      status: failed.some((f) => f.includes("expected")) ? "FAIL" : "PASS",
      detail: "French cookie + browse smoke",
      failedSteps: failed,
      criticalBugs: bugs,
    };
  } catch (e) {
    const { status, msg } = statusForThrown(e);
    if (status === "FAIL") bugs.push(msg);
    return { id: 4, name, status, detail: msg, failedSteps: [...failed, msg], criticalBugs: bugs };
  }
}
