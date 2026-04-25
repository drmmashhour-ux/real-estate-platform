import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { assertBrokerResidentialFsboListing } from "@/lib/broker/residential-fsbo-scope";
import { computeListingMarketingIntelligence } from "@/modules/listing-marketing-intelligence/listing-marketing-intelligence.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.listingMarketingIntelligenceV1) {
    return Response.json({ error: "Listing marketing intelligence disabled" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const listing = await assertBrokerResidentialFsboListing({
    brokerId: session.userId,
    listingId: id,
    role: session.role,
  });
  if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });

  const intel = await computeListingMarketingIntelligence({ brokerId: session.userId, listingId: id });
  return Response.json({ intelligence: intel });
}
