/**
 * Phase 7 — Portfolio OS (broker portfolios, performance, health, AI proposals, allocation).
 * Run from apps/web: pnpm exec tsx scripts/phase7-validation.ts
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/db";
import { computeAndStoreHealthScore } from "@/modules/portfolio/asset-health.service";
import { recordPerformance } from "@/modules/portfolio/asset-performance.service";
import { generateAllocation } from "@/modules/portfolio/capital-allocation.service";
import { generateProposedDecisions } from "@/modules/portfolio/ai-asset-manager.service";
import {
  addAssetToPortfolio,
  createPortfolio,
} from "@/modules/portfolio/portfolio.service";
import { createStandaloneDeal } from "@/modules/deals/deal.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main(): Promise<void> {
  console.log("\n========== Phase 7 portfolio OS validation ==========\n");
  let failed = 0;

  const broker = await prisma.user.findFirst({ where: { role: "BROKER" }, select: { id: true } });
  if (!broker) {
    console.log("SKIP — no BROKER in DB");
    process.exit(0);
  }

  try {
    const deal = await createStandaloneDeal({
      brokerId: broker.id,
      title: "Phase 7 asset seed",
      dealType: "ACQUISITION",
      actorUserId: broker.id,
    });

    const asset = await prisma.lecipmPortfolioAsset.create({
      data: {
        dealId: deal.id,
        assetName: "Validation asset",
        acquisitionPrice: 400_000,
        acquisitionDate: new Date(),
        status: "ACTIVE",
      },
    });

    const portfolio = await createPortfolio(broker.id, { name: "Phase 7 validation portfolio" });

    await addAssetToPortfolio(portfolio.id, asset.id, 1, broker.id, "BROKER");

    await recordPerformance(
      asset.id,
      {
        revenue: 48_000,
        expenses: 17_000,
        occupancyRate: 94,
        period: "MONTHLY",
      },
      portfolio.id,
      broker.id
    );

    await computeAndStoreHealthScore(asset.id, portfolio.id, broker.id);

    const decisions = await generateProposedDecisions(portfolio.id, broker.id);
    if (decisions.length === 0) {
      console.log("FAIL no AI decisions generated");
      failed++;
    } else {
      console.log(`PASS AI decisions (${decisions.length})`);
    }

    const alloc = await generateAllocation(portfolio.id, 500_000, broker.id);
    if (!alloc.proposal?.id) {
      console.log("FAIL allocation proposal");
      failed++;
    } else {
      console.log("PASS capital allocation proposal");
    }

    console.log("\n----------");
    if (failed === 0) console.log("PASS — Phase 7 validation\n");
    else console.log(`FAIL — ${failed} check(s)\n`);

    process.exit(failed === 0 ? 0 : 1);
  } catch (e) {
    console.error(e);
    console.log("\nFAIL — exception\n");
    process.exit(1);
  }
}

main();
