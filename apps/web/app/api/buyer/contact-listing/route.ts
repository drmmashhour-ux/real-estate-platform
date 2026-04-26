import { NextRequest, NextResponse } from "next/server";
import { LeadContactOrigin, NotificationType } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { gateDistributedRateLimit } from "@/lib/rate-limit-enforcement";
import { parseFsboContactBody } from "@/lib/fsbo/validation";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { sendFsboLeadEmailToOwner } from "@/lib/email/fsbo-lead-email";
import { sendTransactionalEmail } from "@/lib/email/provider";
import { getGuestId } from "@/lib/auth/session";
import { getDefaultTenantId } from "@/lib/buyer/tenant-context";
import { recordBuyerGrowthEvent } from "@/lib/buyer/buyer-analytics";
import { assertBuyerContactAllowed } from "@/modules/legal/assert-legal";
import { legalEnforcementDisabled } from "@/modules/legal/legal-enforcement";
import { logImmoContactEvent } from "@/lib/immo/immo-contact-log";
import { ImmoContactEventType } from "@prisma/client";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";
import { logBusinessMilestone, trackEvent } from "@/src/services/analytics";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { buyerHasPaidListingContact, isListingContactPaywallEnabled } from "@/lib/leads";
import { recordAnalyticsFunnelEvent } from "@/lib/funnel/analytics-events";
import { funnelVariantForListing } from "@/lib/funnel/listing-ab";
import { trackFunnelEvent } from "@/lib/funnel/tracker";
import { PRICING } from "@/lib/monetization/pricing";
import { createLecipmBrokerThread } from "@/lib/messages/create-thread";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const gate = await gateDistributedRateLimit(request, "buyer:contact-listing", { windowMs: 60_000, max: 10 });
  if (!gate.allowed) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseFsboContactBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { listingId, name, email, phone, message, distributionChannel } = parsed.data;
  if (!message || message.trim().length < 5) {
    return NextResponse.json({ error: "Message must be at least 5 characters" }, { status: 400 });
  }

  const distributionChannelResolved = distributionChannel === "CENTRIS" ? "CENTRIS" : "LECIPM";

  const tenantId = await getDefaultTenantId();
  const userId = await getGuestId();

  const fsbo = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    include: {
      owner: { select: { id: true, email: true } },
    },
  });

  const crm =
    !fsbo || !isFsboPubliclyVisible(fsbo)
      ? await prisma.listing.findUnique({
          where: { id: listingId },
          include: { owner: { select: { id: true, email: true } } },
        })
      : null;

  if (fsbo && isFsboPubliclyVisible(fsbo)) {
    return handleFsboContact({
      listing: fsbo,
      name,
      email,
      phone,
      message,
      tenantId,
      userId,
      distributionChannel: distributionChannelResolved,
    });
  }

  if (crm) {
    return handleCrmContact({
      listing: crm,
      name,
      email,
      phone,
      message,
      tenantId,
      userId,
      distributionChannel: distributionChannelResolved,
    });
  }

  return NextResponse.json({ error: "Listing not available" }, { status: 404 });
}

async function assertListingContactPaywallForInquiry(input: {
  userId: string | null;
  ownerId: string | null;
  targetListingId: string;
  targetKind: "FSBO_LISTING" | "CRM_LISTING";
}): Promise<NextResponse | null> {
  if (!isListingContactPaywallEnabled()) return null;
  const isOwner = Boolean(input.userId && input.ownerId && input.userId === input.ownerId);
  if (isOwner) return null;
  if (!input.userId) {
    return NextResponse.json(
      {
        error: "Sign in and unlock listing contact before sending an inquiry.",
        code: "LEAD_PAYMENT_REQUIRED",
        priceCents: PRICING.leadPriceCents,
      },
      { status: 401 },
    );
  }
  const paid = await buyerHasPaidListingContact(input.userId, input.targetKind, input.targetListingId);
  if (paid) return null;
  void trackFunnelEvent("contact_click_blocked_paywall", {
    listingId: input.targetListingId,
    targetKind: input.targetKind,
  });
  return NextResponse.json(
    {
      error: "Unlock representative contact to send an inquiry.",
      code: "LEAD_PAYMENT_REQUIRED",
      priceCents: PRICING.leadPriceCents,
    },
    { status: 402 },
  );
}

async function handleFsboContact(opts: {
  listing: {
    id: string;
    title: string;
    city: string;
    priceCents: number;
    ownerId: string;
    owner: { id: string; email: string | null } | null;
  };
  name: string;
  email: string;
  phone: string | null;
  message: string;
  tenantId: string | null;
  userId: string | null;
  distributionChannel?: "CENTRIS" | "LECIPM";
}) {
  const { listing, name, email, phone, message, tenantId, userId, distributionChannel } = opts;
  const distributionChannelResolved = distributionChannel ?? "LECIPM";
  const listingId = listing.id;

  if (!legalEnforcementDisabled()) {
    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Sign in required to contact the listing broker. Complete the buyer acknowledgment in the modal after signing in.",
          code: "LEGAL_SIGN_IN_REQUIRED",
        },
        { status: 401 }
      );
    }
    const licenseBlock = await requireContentLicenseAccepted(userId);
    if (licenseBlock) return licenseBlock;
    const legal = await assertBuyerContactAllowed(userId, listingId);
    if (!legal.ok) {
      return NextResponse.json(
        {
          error: legal.blockingReasons[0] ?? "Complete required legal acknowledgments.",
          code: "LEGAL_FORMS_REQUIRED",
          missing: legal.missing.map((m) => m.key),
        },
        { status: 403 }
      );
    }
  }

  const paywallBlockFsbo = await assertListingContactPaywallForInquiry({
    userId,
    ownerId: listing.ownerId,
    targetListingId: listingId,
    targetKind: "FSBO_LISTING",
  });
  if (paywallBlockFsbo) return paywallBlockFsbo;

  void trackFunnelEvent("contact_click", { listingId, flow: "fsbo" });
  void recordAnalyticsFunnelEvent({
    name: "contact_click",
    listingId,
    userId: userId ?? undefined,
    source: "fsbo_inquiry",
    variant: funnelVariantForListing(listingId),
  });

  const fsboLead = await prisma.fsboLead.create({
    data: {
      listingId,
      name,
      email,
      phone: phone?.trim() || null,
      message,
      leadSource: "DIRECT_BUYER",
      tenantId,
      dealOriginTag: "PLATFORM_ORIGIN",
      commissionEligible: true,
    },
  });

  const crmLead = await prisma.lead.create({
    data: {
      name,
      email,
      phone: phone?.trim() || "—",
      message,
      status: "new",
      score: 55,
      pipelineStatus: "new",
      pipelineStage: "new",
      leadSource: "BUYER",
      userId: userId ?? undefined,
      fsboListingId: listingId,
      contactOrigin: LeadContactOrigin.DIRECT,
      commissionSource: LeadContactOrigin.DIRECT,
      firstPlatformContactAt: new Date(),
      commissionEligible: true,
      source: "buyer_hub",
      highIntent: true,
      distributionChannel: distributionChannelResolved,
    },
  });

  void import("@/modules/playbook-memory/services/playbook-learning-bridge.service").then((m) => {
    m.playbookLearningBridge.afterCrmInquiryLead({
      leadId: crmLead.id,
      city: listing.city,
      listingId,
      leadSource: "BUYER",
    });
  });
  if (userId) {
    void import("@/modules/user-intelligence/integrations/crm-user-intelligence").then((m) => {
      m.recordListingInquiryTouch(userId, { listingId, flow: "fsbo" });
    });
  }

  void recordBuyerGrowthEvent("CONTACT_LISTING_BROKER", listingId, {
    leadId: crmLead.id,
    fsboLeadId: fsboLead.id,
    fsboListingId: listingId,
    sellerUserId: listing.ownerId,
  });

  const origin = getPublicAppUrl();
  const ownerInbox = listing.owner?.email?.trim();
  if (ownerInbox) {
    void sendFsboLeadEmailToOwner({
      to: ownerInbox,
      listingTitle: listing.title,
      listingId: listing.id,
      leadName: name,
      leadEmail: email,
      leadMessage: [phone ? `Phone: ${phone}` : null, message].filter(Boolean).join("\n\n") || message,
      origin,
    });
  }

  try {
    await prisma.notification.create({
      data: {
        userId: listing.ownerId,
        type: NotificationType.CRM,
        title: "New buyer inquiry",
        message: `${name} contacted you about “${listing.title.slice(0, 80)}”.`,
        actionUrl: `/dashboard/fsbo`,
        actionLabel: "View listing",
        metadata: {
          leadId: crmLead.id,
          fsboLeadId: fsboLead.id,
          fsboListingId: listing.id,
          buyerEmail: email,
          flow: "BUYER_HUB_FSBO",
        } as object,
        tenantId: tenantId ?? undefined,
        actorId: userId ?? undefined,
      },
    });
  } catch {
    /* optional */
  }

  void logImmoContactEvent({
    userId,
    listingId,
    listingKind: "fsbo",
    contactType: ImmoContactEventType.MESSAGE,
    metadata: { source: "buyer_contact_listing", leadId: crmLead.id },
    policy: {
      sourceHub: "buyer",
      channel: "form",
      semantic: "formal_lead",
      leadId: crmLead.id,
    },
  });

  void trackEvent(
    "inquiry_sent",
    {
      listingId,
      city: listing.city,
      price: listing.priceCents / 100,
      leadId: crmLead.id,
      flow: "fsbo",
    },
    { userId }
  );
  logBusinessMilestone("INQUIRY CREATED", { listingId, leadId: crmLead.id, flow: "fsbo" });

  void persistLaunchEvent("CONTACT_BROKER", {
    listingId,
    leadId: crmLead.id,
    flow: "fsbo",
    ...(userId ? { userId } : {}),
  });

  return NextResponse.json({ ok: true, leadId: crmLead.id, fsboLeadId: fsboLead.id });
}

async function handleCrmContact(opts: {
  listing: {
    id: string;
    title: string;
    listingCode: string;
    price: number;
    ownerId: string | null;
    owner: { id: string; email: string | null } | null;
  };
  name: string;
  email: string;
  phone: string | null;
  message: string;
  tenantId: string | null;
  userId: string | null;
  distributionChannel?: "CENTRIS" | "LECIPM";
}) {
  const { listing, name, email, phone, message, tenantId, userId, distributionChannel } = opts;
  const distributionChannelResolved = distributionChannel ?? "LECIPM";

  if (!legalEnforcementDisabled()) {
    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Sign in required to contact the listing broker. Complete the buyer acknowledgment in the modal after signing in.",
          code: "LEGAL_SIGN_IN_REQUIRED",
        },
        { status: 401 }
      );
    }
    const licenseBlock = await requireContentLicenseAccepted(userId);
    if (licenseBlock) return licenseBlock;
    const legal = await assertBuyerContactAllowed(userId, listing.id);
    if (!legal.ok) {
      return NextResponse.json(
        {
          error: legal.blockingReasons[0] ?? "Complete required legal acknowledgments.",
          code: "LEGAL_FORMS_REQUIRED",
          missing: legal.missing.map((m) => m.key),
        },
        { status: 403 }
      );
    }
  }

  const paywallBlockCrm = await assertListingContactPaywallForInquiry({
    userId,
    ownerId: listing.ownerId,
    targetListingId: listing.id,
    targetKind: "CRM_LISTING",
  });
  if (paywallBlockCrm) return paywallBlockCrm;

  void trackFunnelEvent("contact_click", { listingId: listing.id, flow: "crm" });
  void recordAnalyticsFunnelEvent({
    name: "contact_click",
    listingId: listing.id,
    userId: userId ?? undefined,
    source: "crm_inquiry",
    variant: funnelVariantForListing(listing.id),
  });

  const priceInt = Number.isFinite(listing.price) ? Math.round(listing.price) : null;

  const crmLead = await prisma.lead.create({
    data: {
      name,
      email,
      phone: phone?.trim() || "—",
      message,
      status: "new",
      score: 55,
      pipelineStatus: "new",
      pipelineStage: "new",
      leadSource: "BUYER",
      listingId: listing.id,
      listingCode: listing.listingCode,
      userId: userId ?? undefined,
      contactOrigin: LeadContactOrigin.DIRECT,
      commissionSource: LeadContactOrigin.DIRECT,
      firstPlatformContactAt: new Date(),
      commissionEligible: true,
      source: "buyer_hub",
      highIntent: true,
      distributionChannel: distributionChannelResolved,
      ...(priceInt != null ? { dealValue: priceInt, estimatedValue: priceInt } : {}),
    },
  });

  void import("@/modules/playbook-memory/services/playbook-learning-bridge.service").then((m) => {
    m.playbookLearningBridge.afterCrmInquiryLead({
      leadId: crmLead.id,
      city: null,
      listingId: listing.id,
      leadSource: "BUYER",
    });
  });
  if (userId) {
    void import("@/modules/user-intelligence/integrations/crm-user-intelligence").then((m) => {
      m.recordListingInquiryTouch(userId, { listingId: listing.id, flow: "crm" });
    });
  }

  void recordBuyerGrowthEvent("CONTACT_LISTING_BROKER", listing.id, {
    leadId: crmLead.id,
    crmListingId: listing.id,
  });

  const origin = getPublicAppUrl();
  const ownerInbox = listing.owner?.email?.trim();
  if (ownerInbox) {
    const bodyHtml = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>New inquiry on marketplace listing <strong>${escapeHtml(listing.title)}</strong> (${escapeHtml(listing.listingCode)}).</p>
<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
<p><strong>Message:</strong><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
<p><a href="${escapeHtml(origin)}/dashboard/broker/leads">Open CRM</a></p>
</body></html>`;
    void sendTransactionalEmail({
      to: ownerInbox,
      subject: `Marketplace inquiry — ${listing.title.slice(0, 60)}`,
      html: bodyHtml,
      template: "crm_listing_inquiry",
      replyTo: email,
    });
  }

  if (listing.ownerId) {
    try {
      await prisma.notification.create({
        data: {
          userId: listing.ownerId,
          type: NotificationType.CRM,
          title: "New buyer inquiry",
          message: `${name} requested information about “${listing.title.slice(0, 80)}”.`,
          actionUrl: `/dashboard/broker/leads`,
          actionLabel: "View leads",
          metadata: { leadId: crmLead.id, crmListingId: listing.id } as object,
          tenantId: tenantId ?? undefined,
          actorId: userId ?? undefined,
        },
      });
    } catch {
      /* optional */
    }
  }

  void logImmoContactEvent({
    userId,
    listingId: listing.id,
    listingKind: "crm",
    contactType: ImmoContactEventType.MESSAGE,
    metadata: { source: "buyer_contact_listing", leadId: crmLead.id },
    policy: {
      sourceHub: "buyer",
      channel: "form",
      semantic: "formal_lead",
      leadId: crmLead.id,
    },
  });

  void trackEvent(
    "inquiry_sent",
    {
      listingId: listing.id,
      city: listing.title,
      ...(priceInt != null ? { price: priceInt } : {}),
      leadId: crmLead.id,
      flow: "crm",
    },
    { userId }
  );
  logBusinessMilestone("INQUIRY CREATED", { listingId: listing.id, leadId: crmLead.id, flow: "crm" });

  void persistLaunchEvent("CONTACT_BROKER", {
    listingId: listing.id,
    leadId: crmLead.id,
    flow: "crm",
    ...(userId ? { userId } : {}),
  });

  let messagingThreadId: string | null = null;
  try {
    const threadResult = userId
      ? await createLecipmBrokerThread({
          listingId: listing.id,
          source: "listing_contact",
          body: message,
          customerUserId: userId,
          subject: null,
        })
      : await createLecipmBrokerThread({
          listingId: listing.id,
          source: "listing_contact",
          body: message,
          guestName: name,
          guestEmail: email,
          subject: null,
        });
    if (threadResult.ok) {
      messagingThreadId = threadResult.threadId;
    }
  } catch (e) {
    console.error("[contact-listing] lecipm messaging thread", e);
  }

  return NextResponse.json({ ok: true, leadId: crmLead.id, messagingThreadId });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
