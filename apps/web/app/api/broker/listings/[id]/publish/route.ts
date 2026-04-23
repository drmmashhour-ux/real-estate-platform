import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { prisma } from "@repo/db";
import {
  ERR_COOWNERSHIP_PUBLISH,
  assertCoownershipPublishAllowed,
  ensureCoOwnershipChecklist,
  logComplianceEvent,
} from "@/services/compliance/coownershipCompliance.service";
import { ensureEsgProfileForListing } from "@/modules/esg/esg.service";
import { complianceFlags } from "@/config/feature-flags";
import {
  loadListingDeclarationComplianceInput,
  sellerRefusedDeclarationFromCompliance,
  validateListingCompliance,
} from "@/modules/legal/compliance/listing-declaration-compliance.service";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";
import { enforceAction } from "@/lib/compliance/enforce-action";
import { createAccountabilityRecord } from "@/lib/compliance/create-accountability-record";

export const dynamic = "force-dynamic";

/** POST — publish CRM listing to marketplace (crmMarketplaceLive = true). Co-ownership gate when enforcement flag is on. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await ctx.params;
  const ok = await canAccessCrmListingCompliance(userId, id);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { tenantId: true, ownerId: true },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const ownerType = listing.tenantId ? "agency" : listing.ownerId ? "solo_broker" : "platform";
  const ownerId = listing.tenantId ?? listing.ownerId ?? "platform";
  const authOwnerType = ownerType === "platform" ? "solo_broker" : ownerType;
  const authOwnerId = ownerType === "platform" ? userId : ownerId;

  const blocked = await rejectIfInspectionReadOnlyMutation(req, {
    ownerType,
    ownerId,
    actorId: userId,
    actorType: "broker",
  });
  if (blocked) return blocked;

  let hasSellerDeclaration = true;
  let sellerDeclarationStatus = "complete";
  if (complianceFlags.sellerDeclarationComplianceGateV1) {
    const dec = await loadListingDeclarationComplianceInput(id);
    if (dec == null) {
      hasSellerDeclaration = false;
      sellerDeclarationStatus = "missing";
    } else if (dec.status === "missing") {
      hasSellerDeclaration = false;
      sellerDeclarationStatus = "missing";
    } else if (dec.status === "refused") {
      hasSellerDeclaration = true;
      sellerDeclarationStatus = "refused";
    } else {
      hasSellerDeclaration = true;
      sellerDeclarationStatus = "complete";
    }
  }

  const snap = await prisma.listingComplianceSnapshot.findUnique({
    where: { listingId: id },
    select: { blockingIssuesJson: true },
  });
  const blocking = snap?.blockingIssuesJson;
  const highRiskScore =
    Array.isArray(blocking) &&
    blocking.some((x) => typeof x === "string" && x.toLowerCase().includes("critical"));

  let authSnapshot: Awaited<ReturnType<typeof enforceAction>> | null = null;

  try {
    authSnapshot = await enforceAction({
      ownerType: authOwnerType,
      ownerId: authOwnerId,
      actorId: userId,
      actionKey: "publish_listing",
      entityType: "listing",
      entityId: id,
      moduleKey: "listings",
      scopeType: "listing",
      scopeId: id,
      decisionOwnerType: ownerType,
      decisionOwnerId: ownerId,
      facts: {
        hasSellerDeclaration,
        sellerDeclarationStatus,
        contractVersionInvalid: false,
        highRiskScore,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ACTION_BLOCKED";
    return NextResponse.json(
      {
        error: msg === "ACTION_BLOCKED" ? "LISTING_PUBLICATION_BLOCKED" : msg,
        message: e instanceof Error ? e.message : undefined,
      },
      { status: 403 },
    );
  }

  try {
    await ensureCoOwnershipChecklist(id);
    await assertCoownershipPublishAllowed(id);

    if (complianceFlags.sellerDeclarationComplianceGateV1) {
      const dec = await loadListingDeclarationComplianceInput(id);
      const compliance = validateListingCompliance(dec);
      if (!compliance.allowed) {
        throw new Error(compliance.reason);
      }
      if (sellerRefusedDeclarationFromCompliance(compliance)) {
        logComplianceEvent("DECLARATION_PUBLISH_WITH_REFUSAL_WARNING", { listingId: id });
      }
    }

    await prisma.listing.update({
      where: { id },
      data: { crmMarketplaceLive: true },
    });

    if (authSnapshot) {
      const { auth } = authSnapshot;
      await createAccountabilityRecord({
        ownerType,
        ownerId,
        entityType: "listing",
        entityId: id,
        actionKey: "publish_listing",
        performedByActorId: userId,
        accountableActorId: auth.accountability.accountableActorId,
        supervisorActorId: auth.accountability.supervisorActorId,
        delegated: !!auth.delegation,
        delegationId: auth.delegation?.id ?? null,
        supervisionId: auth.supervision?.id ?? null,
        approvalRequired: auth.requiresApproval,
        approvalCompleted: !auth.requiresApproval,
      });
    }

    try {
      const { invalidateComplianceStatusCache } = await import("@/lib/compliance/coownership-compliance-cache");
      invalidateComplianceStatusCache(id);
    } catch {
      /* optional */
    }

    logComplianceEvent("listing_published", { listingId: id });

    void ensureEsgProfileForListing(id).catch(() => null);

    return NextResponse.json({ ok: true, crmMarketplaceLive: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "DECLARATION_MISSING" || msg === "DECLARATION_INCOMPLETE") {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    if (msg === ERR_COOWNERSHIP_PUBLISH) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json({ error: "Publish failed" }, { status: 500 });
  }
}
