import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { assertBrokerResidentialFsboListing } from "@/lib/broker/residential-fsbo-scope";
import { generateMarketingDraftsForListing } from "@/modules/marketing-autopilot/marketing-autopilot.service";
import type { MarketingAutopilotOutputType } from "@/modules/marketing-autopilot/marketing-autopilot.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const body = (await request.json().catch(() => ({}))) as {
    kinds?: MarketingAutopilotOutputType[];
    previousPriceCents?: number | null;
  };

  const kinds =
    body.kinds ??
    (["just_listed", "seo_listing_page", "sms_lead_update"] as MarketingAutopilotOutputType[]);

  const result = await generateMarketingDraftsForListing({
    brokerId: session.userId,
    listingId: id,
    kinds,
    previousPriceCents: body.previousPriceCents,
  });

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.marketingDraftGenerated,
    payload: { listingId: id, draftIds: result.draftIds },
  });

  return Response.json(result);
}
