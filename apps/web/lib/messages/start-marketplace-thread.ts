import { LeadContactOrigin, MessageEventType, MessageType, NotificationType } from "@prisma/client";
import { prisma } from "@repo/db";
import { getDefaultTenantId } from "@/lib/buyer/tenant-context";
import { buyerHasPaidListingContact, isListingContactPaywallEnabled } from "@/lib/leads";
import { PRICING } from "@/lib/monetization/pricing";
import { assertBuyerContactAllowed } from "@/modules/legal/assert-legal";
import { legalEnforcementDisabled } from "@/modules/legal/legal-enforcement";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import {
  getOrCreateConversationForContext,
  resolveListingBrokerUserId,
} from "@/modules/messaging/services/create-conversation";
import { notifyNewMessage } from "@/modules/messaging/services/messaging-notifications";
import { publishConversationUpdate } from "@/modules/messaging/services/realtime-adapter";
import { onNewMessage } from "@/modules/notifications/services/workflow-notification-triggers";

export type StartMarketplaceThreadInput = {
  userId: string;
  listingKind: "crm" | "fsbo";
  listingId: string;
  listingUrl: string;
};

export type StartMarketplaceThreadResult =
  | { ok: true; conversationId: string; leadId: string; createdConversation: boolean }
  | { ok: false; error: string; status: number; code?: string; priceCents?: number };

const INTRO_PREFIX = "Hi, I'm interested in this property:";

function marketplaceMessagePath(conversationId: string, listingUrl?: string) {
  try {
    if (listingUrl) {
      const u = new URL(listingUrl);
      const segs = u.pathname.split("/").filter(Boolean);
      if (segs.length >= 2) {
        return `/${segs[0]}/${segs[1]}/messages/${conversationId}`;
      }
    }
  } catch {
    /* fall through */
  }
  const prefix = process.env.NEXT_PUBLIC_PRIMARY_LOCALE_PATH?.trim() || "en/ca";
  const parts = prefix.split("/").filter(Boolean);
  const loc = parts[0] ?? "en";
  const ctry = parts[1] ?? "ca";
  return `/${loc}/${ctry}/messages/${conversationId}`;
}

function buildIntroBody(listingUrl: string) {
  const url = listingUrl.trim() || "(listing link unavailable)";
  return `${INTRO_PREFIX} ${url}`;
}

async function assertPaywall(input: {
  userId: string;
  ownerId: string | null;
  targetListingId: string;
  targetKind: "FSBO_LISTING" | "CRM_LISTING";
}): Promise<StartMarketplaceThreadResult | null> {
  if (!isListingContactPaywallEnabled()) return null;
  if (input.userId && input.ownerId && input.userId === input.ownerId) return null;
  if (!input.userId) {
    return {
      ok: false,
      status: 401,
      code: "LEAD_PAYMENT_REQUIRED",
      error: "Sign in and unlock listing contact before messaging.",
      priceCents: PRICING.leadPriceCents,
    };
  }
  const paid = await buyerHasPaidListingContact(input.userId, input.targetKind, input.targetListingId);
  if (paid) return null;
  return {
    ok: false,
    status: 402,
    code: "LEAD_PAYMENT_REQUIRED",
    error: "Listing contact unlock required before messaging.",
    priceCents: PRICING.leadPriceCents,
  };
}

async function insertIntroIfEmpty(params: {
  conversationId: string;
  senderId: string;
  intro: string;
  recipientUserIds: string[];
}) {
  const existingMsgs = await prisma.message.count({ where: { conversationId: params.conversationId } });
  if (existingMsgs > 0) return null;

  const msg = await prisma.$transaction(async (tx) => {
    const m = await tx.message.create({
      data: {
        conversationId: params.conversationId,
        senderId: params.senderId,
        body: params.intro,
        messageType: MessageType.TEXT,
      },
    });
    const now = new Date();
    await tx.conversation.update({
      where: { id: params.conversationId },
      data: { lastMessageAt: now },
    });
    await tx.messageEvent.create({
      data: {
        conversationId: params.conversationId,
        messageId: m.id,
        actorId: params.senderId,
        type: MessageEventType.MESSAGE_SENT,
      },
    });
    return m;
  });

  void notifyNewMessage({
    conversationId: params.conversationId,
    messageId: msg.id,
    recipientUserIds: params.recipientUserIds,
  });
  void onNewMessage({
    recipientUserIds: params.recipientUserIds,
    senderId: params.senderId,
    conversationId: params.conversationId,
    preview: params.intro.slice(0, 200),
  });
  publishConversationUpdate({ conversationId: params.conversationId, kind: "message_created", messageId: msg.id });
  return msg;
}

async function ensureCrmLead(params: {
  userId: string;
  conversationId: string;
  listing: { id: string; title: string; listingCode: string; price: unknown };
  intro: string;
  brokerUserId: string | null;
}) {
  const existing = await prisma.lead.findFirst({
    where: { userId: params.userId, platformConversationId: params.conversationId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const viewer = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { name: true, email: true, phone: true },
  });
  if (!viewer?.email) throw new Error("User email required");

  const priceInt = Number.isFinite(Number(params.listing.price)) ? Math.round(Number(params.listing.price)) : null;

  const lead = await prisma.lead.create({
    data: {
      name: viewer.name?.trim() || viewer.email.split("@")[0] || "Marketplace buyer",
      email: viewer.email,
      phone: viewer.phone?.trim() || "—",
      message: params.intro,
      status: "new",
      score: 60,
      pipelineStatus: "new",
      pipelineStage: "new",
      leadSource: "MARKETPLACE_CHAT",
      listingId: params.listing.id,
      listingCode: params.listing.listingCode,
      userId: params.userId,
      contactOrigin: LeadContactOrigin.DIRECT,
      commissionSource: LeadContactOrigin.DIRECT,
      firstPlatformContactAt: new Date(),
      commissionEligible: true,
      source: "marketplace_message",
      highIntent: true,
      distributionChannel: "LECIPM",
      platformConversationId: params.conversationId,
      ...(params.brokerUserId ? { introducedByBrokerId: params.brokerUserId } : {}),
      ...(priceInt != null ? { dealValue: priceInt, estimatedValue: priceInt } : {}),
    },
  });
  return lead.id;
}

async function ensureFsboLead(params: {
  userId: string;
  conversationId: string;
  fsbo: { id: string; title: string; listingCode: string | null; priceCents: number; ownerId: string };
  intro: string;
  ownerIsBroker: boolean;
}) {
  const existing = await prisma.lead.findFirst({
    where: { userId: params.userId, platformConversationId: params.conversationId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const viewer = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { name: true, email: true, phone: true },
  });
  if (!viewer?.email) throw new Error("User email required");

  const priceInt = Math.round(params.fsbo.priceCents / 100);

  const lead = await prisma.lead.create({
    data: {
      name: viewer.name?.trim() || viewer.email.split("@")[0] || "Marketplace buyer",
      email: viewer.email,
      phone: viewer.phone?.trim() || "—",
      message: params.intro,
      status: "new",
      score: 60,
      pipelineStatus: "new",
      pipelineStage: "new",
      leadSource: "MARKETPLACE_CHAT",
      fsboListingId: params.fsbo.id,
      listingCode: params.fsbo.listingCode,
      userId: params.userId,
      contactOrigin: LeadContactOrigin.DIRECT,
      commissionSource: LeadContactOrigin.DIRECT,
      firstPlatformContactAt: new Date(),
      commissionEligible: true,
      source: "marketplace_message",
      highIntent: true,
      distributionChannel: "LECIPM",
      platformConversationId: params.conversationId,
      ...(params.ownerIsBroker ? { introducedByBrokerId: params.fsbo.ownerId } : {}),
      dealValue: priceInt,
      estimatedValue: priceInt,
    },
  });
  return lead.id;
}

export async function startMarketplaceThreadFromListing(
  input: StartMarketplaceThreadInput
): Promise<StartMarketplaceThreadResult> {
  const listingId = input.listingId.trim();
  if (!listingId) return { ok: false, status: 400, error: "listingId required" };

  if (!legalEnforcementDisabled()) {
    const licenseBlock = await requireContentLicenseAccepted(input.userId);
    if (licenseBlock) {
      return { ok: false, status: 403, error: "Content license acceptance required" };
    }
  }

  const intro = buildIntroBody(input.listingUrl);

  if (input.listingKind === "crm") {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, crmMarketplaceLive: true },
      select: {
        id: true,
        title: true,
        listingCode: true,
        price: true,
        ownerId: true,
      },
    });
    if (!listing) return { ok: false, status: 404, error: "Listing not available" };
    if (listing.ownerId === input.userId) {
      return { ok: false, status: 400, error: "Cannot message your own listing" };
    }

    if (!legalEnforcementDisabled()) {
      const legal = await assertBuyerContactAllowed(input.userId, listing.id);
      if (!legal.ok) {
        return {
          ok: false,
          status: 403,
          code: "LEGAL_FORMS_REQUIRED",
          error: legal.blockingReasons[0] ?? "Complete required legal acknowledgments.",
        };
      }
    }

    const paywall = await assertPaywall({
      userId: input.userId,
      ownerId: listing.ownerId,
      targetListingId: listing.id,
      targetKind: "CRM_LISTING",
    });
    if (paywall) return paywall;

    try {
      const { conversation, created } = await getOrCreateConversationForContext("listing", listing.id, input.userId);
      const brokerId = (await resolveListingBrokerUserId(listing.id)) ?? listing.ownerId;
      const recipients = brokerId && brokerId !== input.userId ? [brokerId] : [];

      await insertIntroIfEmpty({
        conversationId: conversation.id,
        senderId: input.userId,
        intro,
        recipientUserIds: recipients,
      });

      const leadId = await ensureCrmLead({
        userId: input.userId,
        conversationId: conversation.id,
        listing,
        intro,
        brokerUserId: brokerId !== input.userId ? brokerId : null,
      });

      const tenantId = await getDefaultTenantId();
      const viewer = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { name: true },
      });
      if (brokerId && brokerId !== input.userId) {
        try {
          await prisma.notification.create({
            data: {
              userId: brokerId,
              type: NotificationType.CRM,
              title: "New marketplace message",
              message: `${viewer?.name ?? "A buyer"} messaged you about “${listing.title.slice(0, 60)}”.`,
              actionUrl: marketplaceMessagePath(conversation.id, input.listingUrl),
              actionLabel: "Open chat",
              conversationId: conversation.id,
              metadata: { leadId, listingId: listing.id } as object,
              tenantId: tenantId ?? undefined,
            },
          });
        } catch {
          /* optional */
        }
      }

      return { ok: true, conversationId: conversation.id, leadId, createdConversation: created };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start conversation";
      return { ok: false, status: 400, error: msg };
    }
  }

  const fsbo = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      listingCode: true,
      priceCents: true,
      ownerId: true,
      status: true,
      moderationStatus: true,
      archivedAt: true,
      expiresAt: true,
    },
  });
  if (!fsbo || !isFsboPubliclyVisible(fsbo)) return { ok: false, status: 404, error: "Listing not available" };
  if (fsbo.ownerId === input.userId) return { ok: false, status: 400, error: "Cannot message your own listing" };

  if (!legalEnforcementDisabled()) {
    const legal = await assertBuyerContactAllowed(input.userId, fsbo.id);
    if (!legal.ok) {
      return {
        ok: false,
        status: 403,
        code: "LEGAL_FORMS_REQUIRED",
        error: legal.blockingReasons[0] ?? "Complete required legal acknowledgments.",
      };
    }
  }

  const paywall = await assertPaywall({
    userId: input.userId,
    ownerId: fsbo.ownerId,
    targetListingId: fsbo.id,
    targetKind: "FSBO_LISTING",
  });
  if (paywall) return paywall;

  try {
    const { conversation, created } = await getOrCreateConversationForContext("fsbo_listing", fsbo.id, input.userId);
    const recipients = fsbo.ownerId !== input.userId ? [fsbo.ownerId] : [];

    await insertIntroIfEmpty({
      conversationId: conversation.id,
      senderId: input.userId,
      intro,
      recipientUserIds: recipients,
    });

    const owner = await prisma.user.findUnique({
      where: { id: fsbo.ownerId },
      select: { role: true },
    });
    const leadId = await ensureFsboLead({
      userId: input.userId,
      conversationId: conversation.id,
      fsbo,
      intro,
      ownerIsBroker: owner?.role === "BROKER",
    });

    const tenantId = await getDefaultTenantId();
    const viewer = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { name: true },
    });
    try {
      await prisma.notification.create({
        data: {
          userId: fsbo.ownerId,
          type: NotificationType.CRM,
          title: "New marketplace message",
          message: `${viewer?.name ?? "A buyer"} messaged you about “${fsbo.title.slice(0, 60)}”.`,
          actionUrl: marketplaceMessagePath(conversation.id, input.listingUrl),
          actionLabel: "Open chat",
          conversationId: conversation.id,
          metadata: { leadId, fsboListingId: fsbo.id } as object,
          tenantId: tenantId ?? undefined,
        },
      });
    } catch {
      /* optional */
    }

    return { ok: true, conversationId: conversation.id, leadId, createdConversation: created };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to start conversation";
    return { ok: false, status: 400, error: msg };
  }
}
