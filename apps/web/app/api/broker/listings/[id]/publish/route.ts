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

export const dynamic = "force-dynamic";

/** POST — publish CRM listing to marketplace (crmMarketplaceLive = true). Co-ownership gate when enforcement flag is on. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await ctx.params;
  const ok = await canAccessCrmListingCompliance(userId, id);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await ensureCoOwnershipChecklist(id);
    await assertCoownershipPublishAllowed(id);

    await prisma.listing.update({
      where: { id },
      data: { crmMarketplaceLive: true },
    });

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
    if (msg === ERR_COOWNERSHIP_PUBLISH) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json({ error: "Publish failed" }, { status: 500 });
  }
}
