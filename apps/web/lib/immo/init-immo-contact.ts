import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { LeadContactOrigin } from "@prisma/client";
import { prisma } from "@/lib/db";
import { snapshotBnhubListingForLead } from "@/lib/leads/bnhub-listing-context";
import { resolveImmoIntroducedBrokerId } from "@/lib/immo/resolve-listing";
import type { ImmoListingSnapshot } from "@/lib/immo/resolve-listing";
import { getDefaultTenantId } from "@/lib/buyer/tenant-context";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { assertImmoContactLegalForSession } from "@/lib/immo/immo-contact-legal-gate";

export type InitImmoContactResult = {
  leadId: string;
  conversationId: string | null;
  duplicate: boolean;
};

async function buildBnhubSnapshot(listingRef: string): Promise<ImmoListingSnapshot | null> {
  const snap = await snapshotBnhubListingForLead(listingRef);
  if (!snap) return null;
  const row = await prisma.shortTermListing.findUnique({
    where: { id: snap.listingId },
    select: {
      title: true,
      city: true,
      region: true,
      province: true,
      country: true,
    },
  });
  if (!row) return null;
  const location = [row.city, row.region || row.province, row.country].filter(Boolean).join(", ");
  return {
    kind: "bnhub",
    listingId: snap.listingId,
    listingCode: snap.listingCode,
    title: row.title,
    location: location || "—",
  };
}

async function appendAudit(
  tx: Prisma.TransactionClient,
  params: {
    leadId: string;
    eventType: string;
    actorUserId: string | null;
    listingId: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  await tx.leadContactAuditEvent.create({
    data: {
      leadId: params.leadId,
      eventType: params.eventType,
      actorUserId: params.actorUserId ?? undefined,
      listingId: params.listingId ?? undefined,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

/**
 * Creates or returns an existing ImmoContact lead + optional platform messaging thread.
 * Call after the user accepts the collaboration notice (and before AI qualification completes).
 */
export async function createOrGetImmoContactSession(params: {
  listingRef: string;
  buyerUserId: string | null;
  collaborationNoticeAccepted: boolean;
  existingLeadId?: string | null;
}): Promise<InitImmoContactResult | { error: string; status: number; code?: string }> {
  if (!params.collaborationNoticeAccepted) {
    return { error: "Collaboration notice must be accepted.", status: 400 };
  }

  const snapshot = await buildBnhubSnapshot(params.listingRef);
  if (!snapshot) {
    return { error: "Listing not found.", status: 404 };
  }

  const brokerId = await resolveImmoIntroducedBrokerId(snapshot);

  const legal = await assertImmoContactLegalForSession({
    brokerId,
    buyerUserId: params.buyerUserId,
    requireBuyerAck: Boolean(params.buyerUserId),
  });
  if (!legal.ok) {
    return {
      error: legal.message,
      status: 403,
      code: legal.code,
    };
  }

  if (params.existingLeadId) {
    const existing = await prisma.lead.findUnique({
      where: { id: params.existingLeadId },
      select: {
        id: true,
        listingId: true,
        contactOrigin: true,
        platformConversationId: true,
      },
    });
    if (
      existing &&
      existing.listingId === snapshot.listingId &&
      existing.contactOrigin === LeadContactOrigin.IMMO_CONTACT
    ) {
      return {
        leadId: existing.id,
        conversationId: existing.platformConversationId,
        duplicate: true,
      };
    }
  }

  if (params.buyerUserId) {
    const recent = await prisma.lead.findFirst({
      where: {
        listingId: snapshot.listingId,
        userId: params.buyerUserId,
        contactOrigin: LeadContactOrigin.IMMO_CONTACT,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, platformConversationId: true },
    });
    if (recent) {
      return {
        leadId: recent.id,
        conversationId: recent.platformConversationId,
        duplicate: true,
      };
    }
  }

  const placeholderEmail = `immo.${randomUUID().replace(/-/g, "").slice(0, 16)}@pending.immocontact.lecipm`;

  const firstTouch = new Date();
  const out = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        name: "Pending (ImmoContact)",
        email: placeholderEmail.slice(0, 320),
        phone: "—",
        message:
          "Platform-generated ImmoContact — buyer acknowledged the collaboration notice; qualification in progress.",
        status: "new",
        pipelineStatus: "new",
        pipelineStage: "new",
        score: 0,
        listingId: snapshot.listingId,
        listingCode: snapshot.listingCode ?? undefined,
        introducedByBrokerId: brokerId,
        userId: params.buyerUserId ?? undefined,
        leadSource: "immo_ai_chat",
        contactOrigin: LeadContactOrigin.IMMO_CONTACT,
        commissionSource: LeadContactOrigin.IMMO_CONTACT,
        firstPlatformContactAt: firstTouch,
        commissionEligible: true,
        contactUnlockedAt: new Date(),
        aiExplanation: {
          immoContactInit: true,
          listingTitle: snapshot.title,
          listingCode: snapshot.listingCode,
        } as object,
      },
    });

    await appendAudit(tx, {
      leadId: lead.id,
      eventType: "immo_contact_initiated",
      actorUserId: params.buyerUserId,
      listingId: snapshot.listingId,
      metadata: {
        listingCode: snapshot.listingCode,
        collaborationNoticeAccepted: true,
        firstPlatformContactAt: firstTouch.toISOString(),
      },
    });

    let conversationId: string | null = null;
    if (params.buyerUserId && brokerId) {
      const tenantId = await getDefaultTenantId();
      const conv = await tx.conversation.create({
        data: {
          type: "CLIENT_THREAD",
          tenantId: tenantId ?? undefined,
          createdById: params.buyerUserId,
          subject: `ImmoContact · ${snapshot.listingCode ?? snapshot.listingId.slice(0, 8)} · ${snapshot.title}`.slice(
            0,
            500
          ),
          participants: {
            create: [{ userId: brokerId }, { userId: params.buyerUserId }],
          },
        },
      });
      conversationId = conv.id;
      await tx.lead.update({
        where: { id: lead.id },
        data: { platformConversationId: conv.id },
      });
      await appendAudit(tx, {
        leadId: lead.id,
        eventType: "platform_conversation_created",
        actorUserId: params.buyerUserId,
        listingId: snapshot.listingId,
        metadata: { conversationId: conv.id },
      });
    }

    return { leadId: lead.id, conversationId, duplicate: false };
  });

  await appendLeadTimelineEvent(out.leadId, "immo_contact_session_started", {
    listingId: snapshot.listingId,
    listingCode: snapshot.listingCode,
    conversationId: out.conversationId,
  }).catch(() => {});

  return out;
}
