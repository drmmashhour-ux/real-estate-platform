/**
 * LECIPM launch validation — brokers, billing usage, Trustii credit checks, revenue events (DB-only).
 *
 *   pnpm exec tsx scripts/launch-validation.ts
 *
 * Requires: DATABASE_URL, at least one User with role BROKER (email required for invite accept).
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { prisma } from "@/lib/db";
import { setLaunchPlan } from "@/modules/billing/lecipm-launch-subscription";
import { getBrokerLaunchAnalytics } from "@/modules/growth/growth-analytics.service";
import { acceptInvite, sendInvite } from "@/modules/growth/broker-acquisition.service";
import { createTransaction } from "@/modules/transactions/transaction.service";
import {
  createCreditCheck,
  fetchResult,
  sendRequest,
} from "@/modules/trustii/trustii.service";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main(): Promise<void> {
  console.log("\n========== LECIPM launch validation ==========\n");
  let failed = 0;

  const broker = await prisma.user.findFirst({
    where: { role: "BROKER" },
    select: { id: true, email: true },
  });
  if (!broker?.email) {
    console.log("SKIP — no BROKER user with email");
    process.exit(0);
  }

  try {
    const { invite, token } = await sendInvite({
      email: broker.email,
      invitedByUserId: null,
    });
    console.log(`PASS sendInvite → ${invite.id}`);

    const accepted = await acceptInvite({ token, userId: broker.id });
    if (accepted.status !== "ACCEPTED") failed++;
    else console.log("PASS acceptInvite");

    await setLaunchPlan(broker.id, "PRO");
    console.log("PASS launch plan → PRO (credit + doc gates)");

    const tx = await createTransaction(
      {
        brokerId: broker.id,
        transactionType: "LEASE",
        title: "Launch validation",
      },
      "BROKER"
    );
    console.log(`PASS createTransaction ${tx.transactionNumber}`);

    const ck = await createCreditCheck({
      transactionId: tx.id,
      applicantName: "Test Tenant",
      email: "tenant@example.test",
      billing: { actorRole: "BROKER" },
    });
    await sendRequest(ck.id);
    await fetchResult(ck.id);
    const refreshed = await prisma.lecipmTenantCreditCheck.findUnique({
      where: { id: ck.id },
      select: { status: true, score: true },
    });
    if (refreshed?.status !== "COMPLETED") {
      console.log("FAIL credit check did not complete");
      failed++;
    } else {
      console.log(`PASS Trustii sandbox credit score=${refreshed.score}`);
    }

    const usage = await prisma.lecipmBrokerUsageEvent.findMany({
      where: { userId: broker.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const types = new Set(usage.map((u) => u.type));
    for (const need of ["TRANSACTION", "CREDIT_CHECK"] as const) {
      if (!types.has(need)) {
        console.log(`FAIL missing usage event type ${need}`);
        failed++;
      }
    }
    if (failed === 0) console.log("PASS revenue / usage events recorded");

    const analytics = await getBrokerLaunchAnalytics();
    console.log("PASS analytics snapshot:", JSON.stringify(analytics.creditChecks));
  } catch (e) {
    console.log(`FAIL ${e instanceof Error ? e.message : e}`);
    failed++;
  }

  console.log(failed ? `\n❌ Done with ${failed} failure(s)\n` : "\n✅ Launch validation passed\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
