/**
 * GET /api/deals – List deals for current user (as buyer, seller, or broker).
 * POST /api/deals – Create a new deal. Never trust client-supplied buyerId/sellerId/brokerId:
 *   - brokerId = session user when role is BROKER or ADMIN
 *   - sellerId = listing owner (listingId required)
 *   - buyerId = session user when acting as buyer, else resolved from buyerEmail (registered user only)
 */

import { NextRequest } from "next/server";
import { ImmoContactEventType, LeadContactOrigin } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { generateDealCode } from "@/lib/codes/generate-code";
import { resolveShortTermListingRef } from "@/lib/listing-code";
import { assertBrokerCanParticipateInDeals } from "@/lib/compliance/professional-compliance";
import { notifyAdminsImmoPossibleBypass } from "@/lib/immo/notify-admin-immo-bypass";
import { logImmoContactEvent } from "@/lib/immo/immo-contact-log";
import type { PlatformRole } from "@prisma/client";

export const dynamic = "force-dynamic";

function normalizeBuyerEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim().toLowerCase();
  return t.length ? t : null;
}

function rejectClientPartyIds(body: Record<string, unknown>): Response | null {
  const bad: string[] = [];
  if (body.buyerId != null && body.buyerId !== "") bad.push("buyerId");
  if (body.sellerId != null && body.sellerId !== "") bad.push("sellerId");
  if (body.brokerId != null && body.brokerId !== "") bad.push("brokerId");
  if (bad.length === 0) return null;
  return Response.json(
    {
      error: `Remove from body: ${bad.join(", ")}. Parties are set from your session, listingId, and buyerEmail when required.`,
    },
    { status: 400 }
  );
}

export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const deals = await prisma.deal.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
    },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      broker: { select: { id: true, name: true, email: true } },
      milestones: true,
      _count: { select: { documents: true, payments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return Response.json({ deals });
}

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rejected = rejectClientPartyIds(body);
  if (rejected) return rejected;

  const listingRef = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const priceCents = typeof body.priceCents === "number" ? body.priceCents : Number(body.priceCents);
  const buyerEmail = normalizeBuyerEmail(body.buyerEmail);

  if (!listingRef || !Number.isFinite(priceCents) || priceCents < 0) {
    return Response.json(
      { error: "listingId and priceCents (non-negative) are required" },
      { status: 400 }
    );
  }

  const resolved = await resolveShortTermListingRef(listingRef);
  if (!resolved) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: resolved.id },
    select: { id: true, listingCode: true, ownerId: true },
  });
  if (!listing) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }

  const sellerId = listing.ownerId;
  const dealListingCode = listing.listingCode ?? resolved.listingCode;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, brokerStatus: true, accountStatus: true },
  });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const role = user.role as PlatformRole;
  const isBrokerOrAdmin = role === "BROKER" || role === "ADMIN";
  const isListingPartyRole = ["USER", "CLIENT", "HOST"].includes(role);

  if (isBrokerOrAdmin) {
    if (role === "BROKER") {
      const gate = await assertBrokerCanParticipateInDeals(userId);
      if (!gate.ok) {
        return Response.json(
          { error: gate.reasons.join(". ") || "Broker verification required", reasons: gate.reasons },
          { status: 403 }
        );
      }
      const { assertBrokerAgreementSigned } = await import("@/lib/contracts/broker-agreement-contract");
      const contractGate = await assertBrokerAgreementSigned(userId);
      if (!contractGate.ok) {
        return Response.json(
          {
            error: contractGate.reasons.join(". ") || "Broker agreement required",
            reasons: contractGate.reasons,
            code: "CONTRACTS_REQUIRED",
          },
          { status: 403 }
        );
      }
    }
  } else if (!isListingPartyRole) {
    return Response.json(
      { error: "Only brokers, admins, or users who are the buyer or listing owner can create deals" },
      { status: 403 }
    );
  }

  let buyerId: string;
  let brokerId: string | null;

  if (isBrokerOrAdmin) {
    brokerId = userId;
    if (!buyerEmail) {
      return Response.json(
        { error: "buyerEmail is required when creating a deal as broker or admin (registered buyer account)." },
        { status: 400 }
      );
    }
    const buyerUser = await prisma.user.findUnique({
      where: { email: buyerEmail },
      select: { id: true },
    });
    if (!buyerUser) {
      return Response.json(
        { error: "No registered account for buyerEmail. The buyer must sign up before you open a deal." },
        { status: 400 }
      );
    }
    buyerId = buyerUser.id;
  } else if (sellerId === userId) {
    brokerId = null;
    if (!buyerEmail) {
      return Response.json(
        { error: "buyerEmail is required when you are the listing owner (seller)." },
        { status: 400 }
      );
    }
    const buyerUser = await prisma.user.findUnique({
      where: { email: buyerEmail },
      select: { id: true },
    });
    if (!buyerUser) {
      return Response.json(
        { error: "No registered account for buyerEmail. The buyer must sign up first." },
        { status: 400 }
      );
    }
    buyerId = buyerUser.id;
  } else {
    brokerId = null;
    buyerId = userId;
  }

  if (buyerId === sellerId) {
    return Response.json({ error: "Buyer and seller must be different users" }, { status: 400 });
  }

  const deal = await prisma.$transaction(async (tx) => {
    const dealCode = await generateDealCode(tx);
    return tx.deal.create({
      data: {
        dealCode,
        buyerId,
        sellerId,
        brokerId: brokerId ?? undefined,
        listingId: listing.id,
        listingCode: dealListingCode,
        priceCents: Math.round(priceCents),
        status: "initiated",
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        broker: { select: { id: true, name: true, email: true } },
      },
    });
  });

  void logImmoContactEvent({
    userId: buyerId,
    listingId: listing.id,
    listingKind: "bnhub",
    contactType: ImmoContactEventType.DEAL_STARTED,
    metadata: { dealId: deal.id, path: "deal_create" },
    policy: {
      sourceHub: "buyer",
      channel: "deal",
      semantic: "deal_started",
      dealId: deal.id,
    },
  });

  const immoLead = await prisma.lead.findFirst({
    where: {
      listingId: listing.id,
      userId: buyerId,
      contactOrigin: LeadContactOrigin.IMMO_CONTACT,
      deal: { is: null },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, contactOrigin: true, commissionEligible: true, commissionSource: true },
  });

  if (immoLead) {
    const linked = await prisma.deal.update({
      where: { id: deal.id },
      data: {
        leadId: immoLead.id,
        leadContactOrigin: immoLead.contactOrigin,
        commissionSource: immoLead.commissionSource ?? immoLead.contactOrigin,
        commissionEligible: immoLead.commissionEligible,
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        broker: { select: { id: true, name: true, email: true } },
      },
    });
    await prisma.leadContactAuditEvent
      .create({
        data: {
          leadId: immoLead.id,
          eventType: "deal_linked",
          actorUserId: userId,
          listingId: listing.id,
          metadata: { dealId: deal.id } as object,
        },
      })
      .catch(() => {});
    void logImmoContactEvent({
      userId: buyerId,
      brokerId: linked.brokerId ?? undefined,
      listingId: listing.id,
      listingKind: "bnhub",
      contactType: ImmoContactEventType.DEAL_LINKED,
      metadata: { dealId: deal.id, leadId: immoLead.id, path: "deal_lead_linked" },
      policy: {
        sourceHub: "buyer",
        channel: "deal",
        semantic: "deal_linked",
        dealId: deal.id,
        leadId: immoLead.id,
      },
    });
    return Response.json(linked);
  }

  const priorLead = await prisma.lead.findFirst({
    where: {
      listingId: listing.id,
      userId: buyerId,
      createdAt: { lt: deal.createdAt },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (priorLead) {
    const flagged = await prisma.deal.update({
      where: { id: deal.id },
      data: { possibleBypassFlag: true },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        broker: { select: { id: true, name: true, email: true } },
      },
    });
    await prisma.leadContactAuditEvent
      .create({
        data: {
          leadId: priorLead.id,
          eventType: "possible_bypass_deal",
          actorUserId: userId,
          listingId: listing.id,
          metadata: {
            dealId: deal.id,
            reason: "deal_created_without_immo_auto_link_prior_lead_exists",
          } as object,
        },
      })
      .catch(() => {});
    void notifyAdminsImmoPossibleBypass({
      dealId: deal.id,
      listingId: listing.id,
      priorLeadId: priorLead.id,
    });
    return Response.json(flagged);
  }

  return Response.json(deal);
}
