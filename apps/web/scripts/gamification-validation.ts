/**
 * Broker gamification validation — points, badges, leaderboard row.
 *
 *   cd apps/web && npx tsx scripts/gamification-validation.ts
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";
import { recomputeBrokerGamification } from "@/modules/gamification/broker-recompute.service";
import { sumPointsTotal } from "@/modules/gamification/broker-points.service";
import { buildLeaderboard } from "@/modules/gamification/broker-leaderboard.service";
import { listBadges } from "@/modules/gamification/broker-badges.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main(): Promise<void> {
  console.log("\n========== Broker gamification validation ==========\n");
  let failed = 0;

  try {
    const stamp = Date.now();
    const email = `gam-test-${stamp}@example.test`;

    const broker = await prisma.user.create({
      data: {
        email,
        passwordHash: "gam-test-hash",
        role: PlatformRole.BROKER,
        brokerStatus: "VERIFIED",
        launchOnboardingCompletedAt: new Date(),
      },
      select: { id: true },
    });

    await prisma.generatedDocument.create({
      data: {
        documentType: "transaction_summary",
        relatedEntityType: "transaction",
        relatedEntityId: "txn-test-" + stamp,
        generatedById: broker.id,
        status: "signed",
      },
    });

    const rr = await recomputeBrokerGamification(broker.id);
    if (!rr.ok) failed++;

    const pts = await sumPointsTotal(broker.id);
    if (pts <= 0) failed++;
    console.log(`PASS points ledger sum = ${pts}`);

    const badges = await listBadges(broker.id);
    console.log(`PASS badges earned = ${badges.length}`);
    if (badges.length === 0) failed++;

    await recomputeBrokerGamification(broker.id);

    const board = await buildLeaderboard({ scope: "GLOBAL", window: "ALL_TIME", take: 500 });
    const rank = board.findIndex((r) => r.brokerId === broker.id);
    if (rank < 0) failed++;
    console.log(`PASS leaderboard contains broker (rank ${rank >= 0 ? rank + 1 : "?"})`);

    await prisma.generatedDocument.deleteMany({ where: { generatedById: broker.id } });
    await prisma.user.deleteMany({ where: { id: broker.id } }).catch(() => {});
  } catch (e) {
    console.log(`FAIL ${e instanceof Error ? e.message : e}`);
    failed++;
  }

  console.log(failed ? `\n❌ Completed with ${failed} failure(s)\n` : "\n✅ Gamification validation passed\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
