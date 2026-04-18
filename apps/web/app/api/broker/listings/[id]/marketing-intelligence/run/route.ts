import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { assertBrokerResidentialFsboListing } from "@/lib/broker/residential-fsbo-scope";
import { prisma } from "@/lib/db";
import { computeListingMarketingIntelligence } from "@/modules/listing-marketing-intelligence/listing-marketing-intelligence.service";
import { persistSuggestions } from "@/modules/marketing-drafts/marketing-draft.service";
import { runResidentialMarketingStrategies } from "@/modules/marketing-autopilot/strategies/run-all-strategies";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.listingMarketingIntelligenceV1 || !brokerOpsFlags.residentialMarketingAutopilotV1) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const listing = await assertBrokerResidentialFsboListing({
    brokerId: session.userId,
    listingId: id,
    role: session.role,
  });
  if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });

  const intel = await computeListingMarketingIntelligence({ brokerId: session.userId, listingId: id });
  if (!intel) return Response.json({ error: "Intelligence unavailable" }, { status: 400 });

  const full = await prisma.fsboListing.findUnique({ where: { id } });
  if (!full) return Response.json({ error: "Listing not found" }, { status: 404 });

  const suggestions = runResidentialMarketingStrategies({
    listing: full,
    signals: {
      views: intel.signalSummary.viewsInWindow,
      inquiries: intel.signalSummary.inquiriesInWindow,
      daysOnMarket: intel.signalSummary.daysOnMarket,
    },
  });

  await persistSuggestions({
    listingId: id,
    brokerId: session.userId,
    items: suggestions.map((s) => ({
      suggestionType: s.suggestionType,
      title: s.title,
      summary: [s.summary, "", `Pourquoi: ${s.whyNow}`, `Bénéfice attendu: ${s.expectedBenefit}`, `Risques: ${s.risksAndCautions}`].join(
        "\n",
      ),
      payload: {
        ...s.payload,
        brokerApprovalRequired: s.brokerApprovalRequired,
      },
      confidence: s.confidence,
    })),
  });

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.marketingSuggestionGenerated,
    payload: { listingId: id, count: suggestions.length },
  });

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.listingHealthScoreComputed,
    payload: { listingId: id, healthScore: intel.healthScore },
  });

  return Response.json({ intelligence: intel, suggestionsCreated: suggestions.length });
}
