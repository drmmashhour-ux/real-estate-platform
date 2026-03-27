import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scoreLead } from "@/lib/ai/lead-scoring";
import { tierFromScore } from "@/lib/ai/lead-tier";
import {
  conversionProbabilityForTier,
  scoreLeadRevenueTier,
  mortgageCreditCostForTier,
} from "@/lib/ai/lead-score";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getLeadAttributionFromRequest } from "@/lib/attribution/lead-attribution";
import { headers } from "next/headers";
import { assignMortgageExpertForNewLead } from "@/modules/mortgage/services/expert-service";
import { notifyMortgageExpertNewLead } from "@/modules/mortgage/services/notify-expert-lead";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { sendLeadNotificationToBroker } from "@/lib/email/notifications";
import { resolvePrimaryBrokerUserId } from "@/lib/leads/primary-broker";
import { sendGrowthLeadFollowUpEmail } from "@/lib/growth/lead-nurture";
import { computeDynamicLeadPriceCents, estimateMortgageLeadValueCad } from "@/lib/revenue/dynamic-pricing";
import { normalizeMortgageAbVariant } from "@/lib/revenue/mortgage-ab";

export const dynamic = "force-dynamic";

const MORTGAGE_SERVICE_COMMISSION = 0.3;

/**
 * Public mortgage inquiry — creates CRM lead with leadType=mortgage and assigns an active expert.
 */
export async function POST(req: Request) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "anonymous";
  const limit = checkRateLimit(`public:mortgage-lead:${ip}`, { windowMs: 60_000, max: 15 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
  const emailS = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 320) : "";
  const email = emailS;
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
  const messageRaw = typeof body.message === "string" ? body.message.trim().slice(0, 4000) : "";
  const purchaseRegion =
    typeof body.purchaseRegion === "string" ? body.purchaseRegion.trim().slice(0, 120) : "";
  const buyTimeline =
    typeof body.buyTimeline === "string" ? body.buyTimeline.trim().slice(0, 120) : "";
  const abVariant = normalizeMortgageAbVariant(body.abVariant);

  const mortgageInquiry = {
    purchasePrice: body.purchasePrice != null ? Number(body.purchasePrice) : undefined,
    downPayment: body.downPayment != null ? Number(body.downPayment) : undefined,
    timeline: typeof body.timeline === "string" ? body.timeline.trim().slice(0, 120) : undefined,
    propertyType: typeof body.propertyType === "string" ? body.propertyType.trim().slice(0, 120) : undefined,
    purchaseRegion: purchaseRegion || undefined,
    buyTimeline: buyTimeline || undefined,
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const revenueTier = scoreLeadRevenueTier({
    budget: mortgageInquiry.downPayment,
    propertyPrice: mortgageInquiry.purchasePrice,
    location: purchaseRegion || undefined,
    urgency: [buyTimeline, mortgageInquiry.timeline].filter(Boolean).join(" · ") || undefined,
  });

  const assignment = await assignMortgageExpertForNewLead({ revenueTier });
  const expertId = assignment.type === "expert" ? assignment.expertId : null;
  const inMarketplace = assignment.type === "marketplace";

  const messageLines = [
    "MORTGAGE INQUIRY",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "—"}`,
    mortgageInquiry.purchasePrice != null && Number.isFinite(mortgageInquiry.purchasePrice)
      ? `Purchase price (est.): $${mortgageInquiry.purchasePrice.toLocaleString()}`
      : null,
    mortgageInquiry.downPayment != null && Number.isFinite(mortgageInquiry.downPayment)
      ? `Down payment (est.): $${mortgageInquiry.downPayment.toLocaleString()}`
      : null,
    mortgageInquiry.timeline ? `Timeline: ${mortgageInquiry.timeline}` : null,
    buyTimeline ? `How soon to buy: ${buyTimeline}` : null,
    purchaseRegion ? `City / region: ${purchaseRegion}` : null,
    mortgageInquiry.propertyType ? `Property: ${mortgageInquiry.propertyType}` : null,
    messageRaw ? `Notes: ${messageRaw}` : null,
  ].filter(Boolean);

  const message = messageLines.join("\n");
  const { score, temperature, explanation } = scoreLead({ name, email, phone, message });
  const tier = tierFromScore(score);
  const traffic = getLeadAttributionFromRequest(h.get("cookie"), body);
  const introducedByBrokerId = await resolvePrimaryBrokerUserId().catch(() => null);

  const estimatedValue = estimateMortgageLeadValueCad({
    purchasePrice: mortgageInquiry.purchasePrice,
    downPayment: mortgageInquiry.downPayment,
  });
  const conversionProbability = conversionProbabilityForTier(revenueTier);
  const mortgageCreditCost = mortgageCreditCostForTier(revenueTier);
  const dynamicLeadPriceCents = computeDynamicLeadPriceCents(revenueTier, purchaseRegion || undefined);

  const lead = await prisma.lead.create({
    data: {
      name,
      email,
      phone: phone || "—",
      message,
      status: "new",
      pipelineStatus: "new",
      pipelineStage: "new",
      score,
      leadSource: "mortgage_inquiry",
      leadType: "mortgage",
      assignedExpertId: expertId ?? undefined,
      mortgageMarketplaceStatus: inMarketplace ? "open" : null,
      mortgageInquiry: { ...mortgageInquiry, notes: messageRaw || undefined } as object,
      aiExplanation: {
        form: { score, temperature, explanation },
        leadKind: "mortgage",
        revenueTier,
        mortgageCreditCost,
      } as object,
      aiTier: tier,
      highIntent: revenueTier === "HIGH" || score >= 72,
      contactUnlockedAt: new Date(),
      introducedByBrokerId: introducedByBrokerId ?? undefined,
      source: traffic.source,
      campaign: traffic.campaign,
      medium: traffic.medium,
      estimatedValue: estimatedValue > 0 ? estimatedValue : undefined,
      conversionProbability,
      valueSource: "mortgage_form+ai_rule",
      revenueTier,
      mortgageCreditCost,
      dynamicLeadPriceCents,
      serviceCommissionRate: MORTGAGE_SERVICE_COMMISSION,
      mortgageAssignedAt: expertId ? new Date() : null,
      revenueAbVariant: abVariant,
      purchaseRegion: purchaseRegion || undefined,
    },
  });

  await appendLeadTimelineEvent(lead.id, "mortgage_inquiry_created", {
    expertId,
    mortgageInquiry,
    inMarketplace,
    revenueTier,
    mortgageCreditCost,
  }).catch(() => {});

  void prisma.trafficEvent
    .create({
      data: {
        eventType: "mortgage_lead_submitted",
        path: "/mortgage",
        source: traffic.source,
        campaign: traffic.campaign,
        medium: traffic.medium,
        meta: {
          abVariant,
          revenueTier,
          marketplace: inMarketplace,
          leadId: lead.id,
        } as object,
      },
    })
    .catch(() => {});

  if (expertId) {
    void notifyMortgageExpertNewLead({
      expertId,
      leadId: lead.id,
      clientName: name,
      clientEmail: email,
      purchasePrice:
        mortgageInquiry.purchasePrice != null && Number.isFinite(mortgageInquiry.purchasePrice)
          ? mortgageInquiry.purchasePrice
          : undefined,
      downPayment:
        mortgageInquiry.downPayment != null && Number.isFinite(mortgageInquiry.downPayment)
          ? mortgageInquiry.downPayment
          : undefined,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  void sendLeadNotificationToBroker({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    message: lead.message,
    listingCode: null,
    listingUrl: inMarketplace ? `${baseUrl}/dashboard/expert/marketplace` : `${baseUrl}/dashboard/expert/leads`,
  }).catch(() => {});
  void sendGrowthLeadFollowUpEmail(lead.email, lead.name).catch(() => {});

  return NextResponse.json({
    ok: true,
    leadId: lead.id,
    assignedExpertId: expertId,
    marketplace: inMarketplace,
    revenueTier,
    creditCost: mortgageCreditCost,
  });
}
