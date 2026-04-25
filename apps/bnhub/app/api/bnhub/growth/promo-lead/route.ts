import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { ingestLeadFromConnector } from "@/src/modules/bnhub-growth-engine/services/leadEngineService";
import { leadResponseJob } from "@/src/modules/bnhub-growth-engine/automations/autopilotEngine";

export const dynamic = "force-dynamic";

/** Public promo landing form — ties to campaign slug when valid. */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    promoSlug: string;
    fullName?: string;
    email?: string;
    phone?: string;
    message?: string;
    guestCount?: number;
    /** Honeypot — must stay empty (bots often fill hidden fields). */
    company?: string;
  };
  if (!body.promoSlug) return Response.json({ error: "promoSlug required" }, { status: 400 });
  if (body.company != null && String(body.company).trim() !== "") {
    return Response.json({ ok: true, ignored: true });
  }

  const campaign = await prisma.bnhubGrowthCampaign.findFirst({
    where: { promoSlug: body.promoSlug, status: { in: ["ACTIVE", "READY", "SCHEDULED"] } },
    select: { id: true, listingId: true, hostUserId: true },
  });
  if (!campaign) return Response.json({ error: "Campaign not found or not accepting leads" }, { status: 404 });

  const lead = await ingestLeadFromConnector(
    {
      sourceType: "INTERNAL_FORM",
      sourceConnectorCode: "promo_landing",
      listingId: campaign.listingId,
      campaignId: campaign.id,
      hostUserId: campaign.hostUserId,
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      message: body.message,
      guestCount: body.guestCount,
    },
    { skipDedup: false }
  );
  await leadResponseJob(lead.id);

  return Response.json({ ok: true, leadId: lead.id });
}
