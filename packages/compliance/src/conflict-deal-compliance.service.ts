import { prisma } from "@/lib/db";
import { lecipmOaciqFlags } from "@/config/feature-flags";
import { logConflictComplianceTagged } from "@/lib/server/launch-logger";
import {
  CONFLICT_DISCLOSURE_ACK_TEXT,
  CONFLICT_DISCLOSURE_META_PREVIOUS_STATUS_KEY,
  CONFLICT_REQUIRES_DISCLOSURE_STATUS,
  type ConflictReasonCode,
} from "./conflict-deal-compliance.constants";

export class DealConflictConsentBlockedError extends Error {
  constructor(message = "Client disclosure acknowledgments are required before this deal can progress.") {
    super(message);
    this.name = "DealConflictConsentBlockedError";
  }
}

export function conflictDisclosureEnforced(): boolean {
  return lecipmOaciqFlags.brokerConflictDisclosureV1;
}

type DealConflictCore = {
  id: string;
  status: string;
  brokerId: string | null;
  buyerId: string;
  sellerId: string;
  listingId: string | null;
  executionMetadata: unknown;
};

function asMetaRecord(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return { ...(raw as object) } as Record<string, unknown>;
  return {};
}

export function requiredConflictConsentUserIds(
  deal: Pick<DealConflictCore, "brokerId" | "buyerId" | "sellerId">,
): string[] {
  const b = deal.brokerId;
  if (!b) return [];
  const ids = [deal.buyerId, deal.sellerId].filter((id) => id && id !== b);
  return [...new Set(ids)];
}

export async function evaluateDealConflictFromDb(
  deal: Pick<DealConflictCore, "brokerId" | "buyerId" | "sellerId" | "listingId">,
): Promise<{ hasConflict: boolean; reasons: ConflictReasonCode[] }> {
  const reasons: ConflictReasonCode[] = [];
  const brokerId = deal.brokerId;
  if (!brokerId) return { hasConflict: false, reasons: [] };

  if (deal.buyerId === brokerId || deal.sellerId === brokerId) {
    reasons.push("BROKER_IS_TRANSACTION_PARTY");
  }

  if (deal.listingId) {
    const [fsbo, crmListing, st] = await Promise.all([
      prisma.fsboListing.findUnique({
        where: { id: deal.listingId },
        select: { ownerId: true, listingOwnerType: true },
      }),
      prisma.listing.findUnique({ where: { id: deal.listingId }, select: { ownerId: true } }),
      prisma.shortTermListing.findUnique({ where: { id: deal.listingId }, select: { ownerId: true } }),
    ]);

    if (fsbo && fsbo.ownerId === brokerId && fsbo.listingOwnerType === "BROKER") {
      reasons.push("BROKER_OWNS_PLATFORM_LISTING");
    }
    if (crmListing?.ownerId === brokerId) {
      reasons.push("BROKER_OWNS_PLATFORM_LISTING");
    }
    if (st?.ownerId === brokerId) {
      reasons.push("BROKER_OWNS_PLATFORM_LISTING");
    }

    if (crmListing) {
      const capital = await prisma.amfCapitalDeal.findFirst({
        where: {
          listingId: deal.listingId,
          OR: [
            { sponsorUserId: brokerId },
            { investments: { some: { investor: { userId: brokerId } } } },
          ],
        },
        select: { id: true },
      });
      if (capital) reasons.push("BROKER_CAPITAL_INTEREST");
    }
  }

  const unique = [...new Set(reasons)];
  return { hasConflict: unique.length > 0, reasons: unique };
}

async function consentsSatisfyRequired(dealId: string, requiredUserIds: string[]): Promise<boolean> {
  if (requiredUserIds.length === 0) return true;
  const rows = await prisma.dealConflictClientConsent.findMany({
    where: { dealId, userId: { in: requiredUserIds } },
    select: { userId: true, acknowledgmentText: true },
  });
  return requiredUserIds.every((uid) =>
    rows.some((r) => r.userId === uid && r.acknowledgmentText === CONFLICT_DISCLOSURE_ACK_TEXT),
  );
}

async function restoreDealFromConflictDisclosure(dealId: string, meta: Record<string, unknown>): Promise<void> {
  const prevRaw = meta[CONFLICT_DISCLOSURE_META_PREVIOUS_STATUS_KEY];
  const prev = typeof prevRaw === "string" && prevRaw.length > 0 ? prevRaw : "initiated";
  delete meta[CONFLICT_DISCLOSURE_META_PREVIOUS_STATUS_KEY];
  await prisma.deal.update({
    where: { id: dealId },
    data: { status: prev, executionMetadata: meta as object },
  });
}

/**
 * Recomputes conflict state, sets `CONFLICT_REQUIRES_DISCLOSURE` when needed, restores prior status when cleared or consented.
 */
export async function refreshDealConflictComplianceState(dealId: string): Promise<void> {
  if (!conflictDisclosureEnforced()) return;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      status: true,
      brokerId: true,
      buyerId: true,
      sellerId: true,
      listingId: true,
      executionMetadata: true,
    },
  });
  if (!deal) return;

  const evaluation = await evaluateDealConflictFromDb(deal);
  const required = requiredConflictConsentUserIds(deal);
  const consentsOk = await consentsSatisfyRequired(dealId, required);
  const meta = asMetaRecord(deal.executionMetadata);

  if (!deal.brokerId || !evaluation.hasConflict) {
    if (deal.status === CONFLICT_REQUIRES_DISCLOSURE_STATUS) {
      await restoreDealFromConflictDisclosure(dealId, meta);
    } else if (meta[CONFLICT_DISCLOSURE_META_PREVIOUS_STATUS_KEY] !== undefined) {
      delete meta[CONFLICT_DISCLOSURE_META_PREVIOUS_STATUS_KEY];
      await prisma.deal.update({ where: { id: dealId }, data: { executionMetadata: meta as object } });
    }
    return;
  }

  if (consentsOk) {
    if (deal.status === CONFLICT_REQUIRES_DISCLOSURE_STATUS) {
      await restoreDealFromConflictDisclosure(dealId, meta);
    }
    return;
  }

  if (deal.status !== CONFLICT_REQUIRES_DISCLOSURE_STATUS) {
    meta[CONFLICT_DISCLOSURE_META_PREVIOUS_STATUS_KEY] = deal.status;
    await prisma.deal.update({
      where: { id: dealId },
      data: { status: CONFLICT_REQUIRES_DISCLOSURE_STATUS, executionMetadata: meta as object },
    });
    logConflictComplianceTagged.info("conflict detected", { dealId, reasons: evaluation.reasons });
  }
}

export async function assertDealConflictConsentAllowsProgress(dealId: string): Promise<void> {
  if (!conflictDisclosureEnforced()) return;
  await refreshDealConflictComplianceState(dealId);
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { status: true } });
  if (deal?.status === CONFLICT_REQUIRES_DISCLOSURE_STATUS) {
    throw new DealConflictConsentBlockedError();
  }
}

export type DealConflictDisclosureSurface = {
  enforcementEnabled: boolean;
  dealStatus: string;
  warningMessage: string;
  acknowledgmentText: string;
  reasons: ConflictReasonCode[];
  requiredUserIds: string[];
  consentedUserIds: string[];
  viewerMustAcknowledge: boolean;
  viewerHasAcknowledged: boolean;
};

export async function getDealConflictDisclosureSurface(
  dealId: string,
  viewerUserId: string,
): Promise<DealConflictDisclosureSurface | null> {
  if (!conflictDisclosureEnforced()) return null;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      status: true,
      brokerId: true,
      buyerId: true,
      sellerId: true,
      listingId: true,
    },
  });
  if (!deal?.brokerId) return null;

  const evaluation = await evaluateDealConflictFromDb(deal);
  if (!evaluation.hasConflict) return null;

  const required = requiredConflictConsentUserIds(deal);
  const consents = await prisma.dealConflictClientConsent.findMany({
    where: { dealId, userId: { in: required } },
    select: { userId: true, acknowledgmentText: true },
  });
  const consentedUserIds = consents
    .filter((c) => c.acknowledgmentText === CONFLICT_DISCLOSURE_ACK_TEXT)
    .map((c) => c.userId);

  const viewerMustAcknowledge = required.includes(viewerUserId);
  const viewerHasAcknowledged = consentedUserIds.includes(viewerUserId);

  return {
    enforcementEnabled: true,
    dealStatus: deal.status,
    warningMessage: CONFLICT_DISCLOSURE_WARNING_MESSAGE,
    acknowledgmentText: CONFLICT_DISCLOSURE_ACK_TEXT,
    reasons: evaluation.reasons,
    requiredUserIds: required,
    consentedUserIds,
    viewerMustAcknowledge,
    viewerHasAcknowledged,
  };
}

export async function recordDealConflictClientConsent(input: {
  dealId: string;
  userId: string;
  acknowledgmentText: string;
  clientIp: string | null;
  userAgent: string | null;
}): Promise<void> {
  if (input.acknowledgmentText !== CONFLICT_DISCLOSURE_ACK_TEXT) {
    throw new Error("Invalid acknowledgment text.");
  }

  const deal = await prisma.deal.findUnique({
    where: { id: input.dealId },
    select: { buyerId: true, sellerId: true, brokerId: true },
  });
  if (!deal?.brokerId) throw new Error("Deal not found.");
  const required = requiredConflictConsentUserIds(deal);
  if (!required.includes(input.userId)) throw new Error("Not a consenting party for this deal.");

  await prisma.dealConflictClientConsent.upsert({
    where: { dealId_userId: { dealId: input.dealId, userId: input.userId } },
    create: {
      dealId: input.dealId,
      userId: input.userId,
      acknowledgmentText: input.acknowledgmentText,
      clientIp: input.clientIp,
      userAgent: input.userAgent,
    },
    update: {
      acknowledgmentText: input.acknowledgmentText,
      acceptedAt: new Date(),
      clientIp: input.clientIp,
      userAgent: input.userAgent,
    },
  });

  logConflictComplianceTagged.info("consent accepted", { dealId: input.dealId, userId: input.userId });
  await refreshDealConflictComplianceState(input.dealId);
}
