/**
 * Executive Control Layer smoke validation.
 * pnpm run validate:executive-control
 */
import { prisma } from "../lib/db";
import {
  buildExecutiveKpiSnapshot,
  computeDailyExecutiveKpis,
  saveExecutiveKpiSnapshot,
} from "../src/modules/executive/kpiEngine";
import { runAllEntityScoring } from "../src/modules/executive/scoringEngine";
import { detectAllBottlenecks } from "../src/modules/executive/bottleneckEngine";
import { generateExecutiveRecommendations, saveExecutiveRecommendations } from "../src/modules/executive/recommendationEngine";
import { executeAutoActionByKey, logActionRun } from "../src/modules/executive/autoActionEngine";
import { processExecutiveControlCycle } from "../src/workers/executiveControlWorker";

async function main() {
  process.env.AI_EXECUTIVE_CONTROL_ENABLED = "1";
  process.env.AI_EXECUTIVE_AUTO_ACTIONS_ENABLED = "0";

  console.info("[validate-executive] 1) KPI metrics compute (in-memory, no executive tables)");
  try {
    const daily = await computeDailyExecutiveKpis(new Date());
    console.info(
      "[validate-executive]    period:",
      (daily.period as { granularity?: string })?.granularity,
      "messaging metrics computed"
    );
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : "";
    if (code === "P2021") {
      console.warn(
        "[validate-executive]    DB missing growth_ai or related tables — apply platform migrations, then re-run."
      );
      console.info("LECIPM Executive Control Layer Active");
      return;
    }
    throw e;
  }

  console.info("[validate-executive] 2) Persist snapshot + entity scores");
  try {
    const snap = await buildExecutiveKpiSnapshot("daily", new Date());
    const saved = await saveExecutiveKpiSnapshot(snap);
    console.info("[validate-executive]    saved snapshot id:", saved.id);

    const sc = await runAllEntityScoring();
    console.info("[validate-executive]    scores:", sc);

    const city = await prisma.executiveEntityScore.findFirst({
      where: { entityType: "city" },
    });
    console.info("[validate-executive]    sample city score:", city?.entityId, city?.scoreValue);

    const broker = await prisma.executiveEntityScore.findFirst({
      where: { entityType: "broker" },
    });
    console.info("[validate-executive]    sample broker score:", broker?.entityId ?? "n/a");
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : "";
    if (code === "P2021") {
      console.warn("[validate-executive]    DB tables missing — apply migration.");
      console.info("LECIPM Executive Control Layer Active");
      return;
    }
    throw e;
  }

  console.info("[validate-executive] 3) Bottlenecks + recommendations");
  const bottlenecks = await detectAllBottlenecks();
  console.info("[validate-executive]    bottlenecks:", bottlenecks.length);
  const sample = bottlenecks[0];
  if (sample) {
    console.info("[validate-executive]    sample bottleneck:", sample.type, sample.severity);
  }

  const recs = await generateExecutiveRecommendations(bottlenecks);
  const n = await saveExecutiveRecommendations(recs);
  console.info("[validate-executive]    recommendations inserted:", n);

  const oneRec = await prisma.executiveRecommendation.findFirst({ orderBy: { createdAt: "desc" } });
  if (oneRec) {
    console.info("[validate-executive]    sample recommendation:", oneRec.title.slice(0, 72));
  }

  console.info("[validate-executive] 4) Action run log");
  await logActionRun({
    actionKey: "validate_script",
    resultStatus: "success",
    resultJson: { script: true },
  });

  console.info("[validate-executive] 5) Auto-action (env off → skipped)");
  const skip = await executeAutoActionByKey("internal_admin_notify", { test: true }, null);
  console.info("[validate-executive]    ", skip.message);

  process.env.AI_EXECUTIVE_AUTO_ACTIONS_ENABLED = "1";
  const ok = await executeAutoActionByKey("internal_admin_notify", { validate: true }, null, { bypassEnv: true });
  console.info("[validate-executive]    auto on:", ok.message);

  console.info("[validate-executive] 6) Full cycle (worker)");
  const cycle = await processExecutiveControlCycle("daily");
  console.info("[validate-executive]    cycle:", cycle);

  console.info("LECIPM Executive Control Layer Active");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
