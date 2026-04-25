import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { assertBrokerResidentialFsboListing } from "@/lib/broker/residential-fsbo-scope";
import { listMarketingDrafts } from "@/modules/marketing-drafts/marketing-draft.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.residentialMarketingAutopilotV1) {
    return Response.json({ error: "Marketing autopilot disabled" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const listing = await assertBrokerResidentialFsboListing({
    brokerId: session.userId,
    listingId: id,
    role: session.role,
  });
  if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });

  const drafts = await listMarketingDrafts(id, session.userId);
  return Response.json({ drafts });
}
