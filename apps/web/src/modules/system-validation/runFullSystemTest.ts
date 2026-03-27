import {
  assertStripeSandboxForBillingSimulation,
  assertSystemValidationAllowed,
} from "@/src/modules/system-validation/assertSafeTestEnvironment";
import { ensureTestFixtures } from "@/src/modules/system-validation/ensureTestFixtures";
import { generateTestUsers } from "@/src/modules/system-validation/generateTestUsers";
import { generateSystemReport } from "@/src/modules/system-validation/generateSystemReport";
import { saveSystemValidationReport } from "@/src/modules/system-validation/report-store";
import { runCoreFlows } from "@/src/modules/system-validation/runCoreFlows";
import { runScalingSimulation } from "@/src/modules/system-validation/scalingSimulation";
import type { SystemValidationReport } from "@/src/modules/system-validation/types";

export type RunFullSystemTestOptions = {
  /** Skip 50-user scaling probe (faster local runs). */
  skipScaling?: boolean;
  scalingConcurrency?: number;
};

/**
 * Orchestrates: test users → fixtures → module flows → metrics → report (persisted under `.system-validation/`).
 */
export async function runFullSystemTest(
  options: RunFullSystemTestOptions = {},
): Promise<SystemValidationReport> {
  assertSystemValidationAllowed();
  const stripe = assertStripeSandboxForBillingSimulation();

  const users = await generateTestUsers();
  const brokerSeller = users.find((u) => u.role === "BROKER" && u.plan === "free");
  const buyer = users.find((u) => u.role === "BUYER" && u.plan === "free");
  if (!brokerSeller || !buyer) {
    throw new Error("generateTestUsers did not produce broker + buyer for fixtures.");
  }

  const fixtures = await ensureTestFixtures({
    sellerUserId: brokerSeller.id,
    buyerUserId: buyer.id,
  });

  const { flowResults, errors, performance, conversion } = await runCoreFlows({ users, fixtures });

  let scaling: SystemValidationReport["scaling"];
  if (!options.skipScaling) {
    scaling = await runScalingSimulation({
      listingId: fixtures.listingId,
      concurrency: options.scalingConcurrency ?? 50,
    });
  }

  const report = generateSystemReport({
    usersCreated: users.length,
    userSummaries: users.map((u) => ({ email: u.email, role: u.role, plan: u.plan })),
    fixtureIds: {
      listingId: fixtures.listingId,
      declarationDraftId: fixtures.declarationDraftId,
      propertyIdentityId: fixtures.propertyIdentityId,
      transactionId: fixtures.transactionId,
    },
    flows: flowResults,
    errors,
    performance,
    conversion,
    scaling,
    stripe,
  });

  await saveSystemValidationReport(report);
  return report;
}
