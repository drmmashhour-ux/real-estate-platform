/**
 * Phase 8 demo — subscriptions, rulesets, API key (prints plain key once).
 * TRUSTGRAPH_ENABLED=true + Phase 8 flags as needed.
 *   npx tsx prisma/seed-trustgraph-phase8-demo.ts
 */
import { TrustgraphSubscriptionStatus } from "@prisma/client";
import { prisma } from "../lib/db";
import { ensureDefaultPlanIfMissing } from "../lib/trustgraph/infrastructure/services/billingService";
import { createPartnerApiKey } from "../lib/trustgraph/infrastructure/services/apiKeyService";

async function main() {
  await prisma.trustgraphComplianceRuleset.upsert({
    where: { code: "CA-DEFAULT" },
    create: {
      code: "CA-DEFAULT",
      name: "Canada default",
      regionPattern: null,
      config: {
        requiredFields: ["description", "city", "address"],
        requiredDocuments: [],
        disclosureRequirements: [],
      } as object,
    },
    update: {},
  });

  await prisma.trustgraphComplianceRuleset.upsert({
    where: { code: "CA-QC" },
    create: {
      code: "CA-QC",
      name: "Quebec",
      regionPattern: "montreal|montréal|qc|québec|quebec",
      config: {
        requiredFields: ["description", "city", "address"],
        legalConstraints: ["disclosure_french_available"],
      } as object,
    },
    update: {},
  });

  const ws = await prisma.trustgraphComplianceWorkspace.findFirst();
  if (!ws) {
    console.log("No workspace — run Phase 7 seed first.");
    return;
  }

  const planId = await ensureDefaultPlanIfMissing();
  if (!planId) return;

  await prisma.trustgraphSubscription.upsert({
    where: { id: "phase8-seed-sub-1" },
    create: {
      id: "phase8-seed-sub-1",
      workspaceId: ws.id,
      planId,
      status: TrustgraphSubscriptionStatus.active,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 86400000 * 30),
    },
    update: { status: TrustgraphSubscriptionStatus.active },
  });

  const key = await createPartnerApiKey({ workspaceId: ws.id, label: "demo-partner" });
  if ("plainKey" in key) {
    console.log("DEMO API KEY (store securely):", key.plainKey);
  } else {
    console.log("External API disabled — enable TRUSTGRAPH_EXTERNAL_API_ENABLED");
  }

  await prisma.trustgraphRecertificationJob.upsert({
    where: { id: "phase8-seed-recert-1" },
    create: {
      id: "phase8-seed-recert-1",
      workspaceId: ws.id,
      subjectType: "LISTING",
      subjectId: (await prisma.fsboListing.findFirst({ select: { id: true } }))?.id ?? "demo",
      status: "pending",
      nextRunAt: new Date(),
    },
    update: { nextRunAt: new Date() },
  });

  console.log("Phase 8 seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
