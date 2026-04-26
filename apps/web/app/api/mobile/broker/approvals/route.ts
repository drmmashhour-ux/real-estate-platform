import { requireDailyActionCenterEnabled, requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { brokerMobileFlags } from "@/config/feature-flags";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  const disabled = requireDailyActionCenterEnabled();
  if (disabled) return disabled;
  if (!brokerMobileFlags.mobileQuickApprovalsV1) {
    return Response.json({ error: "Mobile quick approvals disabled" }, { status: 403 });
  }

  const [drafts, suggestions] = await Promise.all([
    prisma.lecipmCommunicationDraft.findMany({
      where: { brokerId: auth.user.id, status: "pending_approval" },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true,
        channel: true,
        subject: true,
        dealId: true,
        updatedAt: true,
      },
    }),
    prisma.negotiationSuggestion.findMany({
      where: {
        status: "pending_review",
        deal: { brokerId: auth.user.id },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, dealId: true, title: true, updatedAt: true },
    }),
  ]);

  await logGrowthEngineAudit({
    actorUserId: auth.user.id,
    action: "mobile_broker_approvals_list",
    payload: { drafts: drafts.length, suggestions: suggestions.length },
  });

  return Response.json({
    kind: "mobile_broker_approvals_v1",
    communicationDrafts: drafts.map((d) => ({
      id: d.id,
      actionId: `dac:draft:${d.id}`,
      channel: d.channel,
      subject: d.subject,
      dealId: d.dealId,
      updatedAt: d.updatedAt.toISOString(),
    })),
    negotiationSuggestions: suggestions.map((s) => ({
      id: s.id,
      actionId: `dac:deal:${s.dealId}:neg:${s.id}`,
      dealId: s.dealId,
      title: s.title,
      updatedAt: s.updatedAt.toISOString(),
    })),
  });
}
