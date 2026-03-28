/**
 * Run (or skip) the daily executive cycle and print the latest recommendation set.
 * Mirrors typical staging flags: executive + ranking + fraud detection on.
 *
 *   pnpm --filter @lecipm/web run inspect:executive-daily
 *   pnpm --filter @lecipm/web run inspect:executive-daily -- --query-only
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "../lib/db";
import { processExecutiveControlCycle } from "../src/workers/executiveControlWorker";

config({ path: resolve(process.cwd(), ".env") });

const queryOnly = process.argv.includes("--query-only");

async function main() {
  process.env.AI_EXECUTIVE_CONTROL_ENABLED = "1";
  process.env.AI_EXECUTIVE_AUTO_ACTIONS_ENABLED = "0";
  process.env.AI_RANKING_ENGINE_ENABLED = "1";
  process.env.AI_FRAUD_DETECTION_ENABLED = "1";

  if (!queryOnly) {
    console.info("[inspect-executive-daily] Running processExecutiveControlCycle(\"daily\")…");
    try {
      const cycle = await processExecutiveControlCycle("daily");
      console.info("[inspect-executive-daily] Cycle result:", JSON.stringify(cycle, null, 2));
    } catch (e: unknown) {
      const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : "";
      console.warn(
        "[inspect-executive-daily] Cycle failed (migrations / DB?):",
        code || (e instanceof Error ? e.message : e)
      );
    }
  } else {
    console.info("[inspect-executive-daily] --query-only: skipping cycle");
  }

  try {
    const recs = await prisma.executiveRecommendation.findMany({
      orderBy: [{ createdAt: "desc" }, { priorityScore: "desc" }],
      take: 30,
      select: {
        id: true,
        recommendationType: true,
        priorityScore: true,
        status: true,
        title: true,
        summary: true,
        targetEntityType: true,
        targetEntityId: true,
        createdAt: true,
      },
    });

    console.info(`\n[inspect-executive-daily] Latest ${recs.length} executive recommendations:\n`);
    for (const r of recs) {
      const t = r.title.length > 90 ? `${r.title.slice(0, 90)}…` : r.title;
      console.info(
        `  [P${r.priorityScore}] ${r.recommendationType} | ${r.status} | ${r.createdAt.toISOString()}`
      );
      console.info(`    ${t}`);
      if (r.targetEntityType && r.targetEntityId) {
        console.info(`    target: ${r.targetEntityType} ${r.targetEntityId.slice(0, 12)}…`);
      }
      console.info("");
    }

    if (recs.length === 0) {
      console.info("  (no rows — run without --query-only after migrations, or seed activity.)");
    }
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : "";
    console.warn(
      "[inspect-executive-daily] Could not read executive_recommendations:",
      code || (e instanceof Error ? e.message : e)
    );
  } finally {
    await prisma.$disconnect();
  }

  console.info("LECIPM Executive Daily Recommendation Inspect Done");
}

void main();
