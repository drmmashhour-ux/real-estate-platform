/**
 * Phase 7 TrustGraph enterprise demo — run from apps/web with Phase 7 flags enabled.
 *   TRUSTGRAPH_ENABLED=true TRUSTGRAPH_ENTERPRISE_WORKSPACES_ENABLED=true npx tsx prisma/seed-trustgraph-phase7-demo.ts
 */
import { TrustgraphComplianceOrgType } from "@prisma/client";
import { prisma } from "../lib/db";
import { createComplianceWorkspaceRecord } from "../lib/trustgraph/infrastructure/services/complianceWorkspaceService";

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) {
    console.log("No admin user — skip Phase 7 seed.");
    return;
  }

  const broker = await prisma.mortgageBroker.findFirst({ select: { id: true } });
  const listing = await prisma.fsboListing.findFirst({ select: { id: true } });

  const created = await createComplianceWorkspaceRecord({
    orgType: TrustgraphComplianceOrgType.brokerage,
    orgId: broker?.id ?? "demo-broker-org",
    name: "Demo Brokerage Compliance",
    branding: {
      displayLabel: "Demo Realty Trust",
      primaryColor: "#0f766e",
      logoUrl: null,
    },
    settings: { defaultQueuePriority: "normal" },
    creatorUserId: admin.id,
  });

  if ("skipped" in created && created.skipped) {
    console.log("Enterprise workspaces disabled — set TRUSTGRAPH_ENTERPRISE_WORKSPACES_ENABLED=true");
    return;
  }

  const wsId = "workspaceId" in created ? created.workspaceId : null;
  if (!wsId || !listing) {
    console.log("Missing workspace or listing — partial seed.");
    return;
  }

  await prisma.trustgraphComplianceWorkspaceEntityLink.create({
    data: {
      workspaceId: wsId,
      entityType: "LISTING",
      entityId: listing.id,
      relationType: "portfolio",
    },
  }).catch(() => {
    /* duplicate link acceptable */
  });

  console.log("Phase 7 workspace:", wsId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
