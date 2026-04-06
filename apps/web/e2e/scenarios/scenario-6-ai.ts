import type { ScenarioContext, ScenarioResult } from "./_context";
import { e2eScenarioStart, e2eStep } from "./_log";
import { trackGrowthEvent } from "../utils/api";
import { statusForThrown } from "../utils/infra";
import { bnhubLoginAs } from "./_session";

export async function scenario6AiRecommendations(ctx: ScenarioContext): Promise<ScenarioResult> {
  const failed: string[] = [];
  const bugs: string[] = [];
  const name = "Scenario 6 — AI / autopilot recommendations";

  try {
    await ctx.page.context().clearCookies();
    e2eStep("s6_host_login");
    await bnhubLoginAs(ctx.page, "host@demo.com");

    await ctx.page.request.patch(`${ctx.origin}/api/me/ui-locale`, {
      data: { locale: "fr" },
      headers: { "Content-Type": "application/json" },
    });
    e2eStep("s6_locale_fr_api");
    await trackGrowthEvent(ctx.page, ctx.origin, {
      event: "language_switched",
      locale: "fr",
      path: "/api/me/ui-locale",
    });

    e2eStep("s6_autopilot_run");
    const run = await ctx.page.request.post(`${ctx.origin}/api/ai/host-autopilot/run`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!run.ok()) {
      failed.push(`autopilot run ${run.status()}: ${await run.text()}`);
    }

    e2eStep("s6_recommendations_get");
    const rec = await ctx.page.request.get(`${ctx.origin}/api/ai/recommendations?status=all`);
    if (!rec.ok()) {
      failed.push(`recommendations ${rec.status()}`);
      return { id: 6, name, status: "FAIL", detail: failed.join("; "), failedSteps: failed, criticalBugs: bugs };
    }
    const body = (await rec.json()) as { recommendations?: { title?: string; description?: string }[] };
    const rows = body.recommendations ?? [];
    e2eStep("s6_recommendation_count", { count: rows.length });

    for (const r of rows.slice(0, 5)) {
      if (typeof r.title !== "string" || !r.title.length) {
        failed.push("recommendation missing title");
        break;
      }
    }
    return {
      id: 6,
      name,
      status: failed.length ? "FAIL" : "PASS",
      detail: `recommendations rows=${rows.length}; autopilot run attempted`,
      failedSteps: failed,
      criticalBugs: bugs,
    };
  } catch (e) {
    const { status, msg } = statusForThrown(e);
    if (status === "FAIL") bugs.push(msg);
    return { id: 6, name, status, detail: msg, failedSteps: [...failed, msg], criticalBugs: bugs };
  }
}
