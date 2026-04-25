import type { BrokerDisclosureRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { lecipmOaciqFlags } from "@/config/feature-flags";
import { logOaciqComplianceTagged } from "@/lib/server/launch-logger";
import { evaluateDealConflictFromDb } from "@/lib/compliance/conflict-deal-compliance.service";
import { resolveResponsibleBrokerIdForCrmListing } from "@/lib/compliance/oaciq/broker-decision-authority";

export class MandatoryBrokerDisclosureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MandatoryBrokerDisclosureError";
  }
}

export function mandatoryBrokerDisclosureEnforced(): boolean {
  return lecipmOaciqFlags.mandatoryBrokerDisclosureV1;
}

const ROLE_LABEL: Record<BrokerDisclosureRole, string> = {
  BROKER: "broker",
  BUYER: "buyer",
  SELLER: "seller",
  INVESTOR: "investor",
};

export function formatBrokerDisclosureDeclarationLine(input: {
  brokerName: string;
  licenceNumber: string;
  role: BrokerDisclosureRole;
}): string {
  const name = input.brokerName.trim() || "the undersigned broker";
  const lic = input.licenceNumber.trim() || "pending registration";
  return `I, ${name}, holder of OACIQ license ${lic}, declare my role in this transaction as: ${ROLE_LABEL[input.role]}.`;
}

export function formatBrokerDisclosureDeclarationHtml(declarationLine: string): string {
  return `<section class="oaciq-broker-mandatory-disclosure" data-compliance="oaciq_broker_disclosure"><p><strong>Mandatory broker disclosure (OACIQ)</strong></p><p>${escapeHtml(
    declarationLine,
  )}</p></section>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadBrokerDisplayAndLicence(brokerId: string): Promise<{ name: string; licenceNumber: string }> {
  const u = await prisma.user.findUnique({
    where: { id: brokerId },
    select: {
      name: true,
      lecipmBrokerLicenceProfile: { select: { licenceNumber: true } },
      oaciqLicenseNumber: true,
    },
  });
  const licence =
    u?.lecipmBrokerLicenceProfile?.licenceNumber?.trim() || u?.oaciqLicenseNumber?.trim() || "";
  return { name: u?.name?.trim() || "", licenceNumber: licence };
}

async function evaluateListingFinancialConflict(
  brokerId: string,
  crmListingId: string,
): Promise<{ hasConflict: boolean; conflictDescription: string | null }> {
  const capital = await prisma.amfCapitalDeal.findFirst({
    where: {
      listingId: crmListingId,
      OR: [
        { sponsorUserId: brokerId },
        { investments: { some: { investor: { userId: brokerId } } } },
      ],
    },
    select: { id: true },
  });
  if (capital) {
    return {
      hasConflict: true,
      conflictDescription: "Broker is a sponsor or investor on a capital deal linked to this listing.",
    };
  }
  return { hasConflict: false, conflictDescription: null };
}

async function evaluateFsboBrokerInventoryConflict(
  brokerId: string,
  fsboListingId: string,
): Promise<{ hasConflict: boolean; conflictDescription: string | null }> {
  const row = await prisma.fsboListing.findUnique({
    where: { id: fsboListingId },
    select: { ownerId: true, listingOwnerType: true },
  });
  if (!row) return { hasConflict: false, conflictDescription: null };
  if (row.listingOwnerType === "BROKER" && row.ownerId === brokerId) {
    return {
      hasConflict: true,
      conflictDescription: "Broker holds this property as broker-managed platform inventory.",
    };
  }
  return { hasConflict: false, conflictDescription: null };
}

function parseBrokerDisclosureRole(raw: unknown): BrokerDisclosureRole | null {
  if (raw === "BROKER" || raw === "BUYER" || raw === "SELLER" || raw === "INVESTOR") return raw;
  return null;
}

export type RecordBrokerDisclosureInput = {
  brokerId: string;
  actorUserId: string;
  role: BrokerDisclosureRole;
  dealId?: string | null;
  listingId?: string | null;
  fsboListingId?: string | null;
};

/**
 * Persists a broker disclosure row with auto conflict detection. Exactly one of dealId, listingId (CRM), or fsboListingId should be set.
 */
export async function recordBrokerMandatoryDisclosure(input: RecordBrokerDisclosureInput): Promise<{ id: string }> {
  const scopes = [input.dealId, input.listingId, input.fsboListingId].filter(Boolean);
  if (scopes.length !== 1) {
    throw new MandatoryBrokerDisclosureError("Provide exactly one of dealId, listingId, or fsboListingId.");
  }

  if (input.actorUserId !== input.brokerId) {
    const actor = await prisma.user.findUnique({ where: { id: input.actorUserId }, select: { role: true } });
    if (actor?.role !== "ADMIN") {
      throw new MandatoryBrokerDisclosureError("Only the broker or an admin may file this disclosure.");
    }
  }

  let hasConflict = false;
  let conflictDescription: string | null = null;

  if (input.dealId) {
    const deal = await prisma.deal.findUnique({
      where: { id: input.dealId },
      select: { brokerId: true, buyerId: true, sellerId: true, listingId: true },
    });
    if (!deal?.brokerId || deal.brokerId !== input.brokerId) {
      throw new MandatoryBrokerDisclosureError("Deal not found or broker mismatch.");
    }
    const ev = await evaluateDealConflictFromDb(deal);
    hasConflict = ev.hasConflict;
    conflictDescription = ev.reasons.length ? ev.reasons.join("; ") : null;
  } else if (input.listingId) {
    const row = await prisma.listing.findUnique({
      where: { id: input.listingId },
      select: { ownerId: true },
    });
    if (row?.ownerId !== input.brokerId) {
      const actor = await prisma.user.findUnique({ where: { id: input.actorUserId }, select: { role: true } });
      if (actor?.role !== "ADMIN") {
        throw new MandatoryBrokerDisclosureError("Listing broker mismatch.");
      }
    }
    const fin = await evaluateListingFinancialConflict(input.brokerId, input.listingId);
    hasConflict = fin.hasConflict;
    conflictDescription = fin.conflictDescription;
  } else if (input.fsboListingId) {
    const row = await prisma.fsboListing.findUnique({
      where: { id: input.fsboListingId },
      select: { ownerId: true },
    });
    if (!row || row.ownerId !== input.brokerId) {
      throw new MandatoryBrokerDisclosureError("FSBO listing not found or broker mismatch.");
    }
    const fs = await evaluateFsboBrokerInventoryConflict(input.brokerId, input.fsboListingId);
    hasConflict = fs.hasConflict;
    conflictDescription = fs.conflictDescription;
  }

  const { name, licenceNumber } = await loadBrokerDisplayAndLicence(input.brokerId);
  const declarationLine = formatBrokerDisclosureDeclarationLine({
    brokerName: name,
    licenceNumber,
    role: input.role,
  });

  const row = await prisma.brokerDisclosure.create({
    data: {
      brokerId: input.brokerId,
      dealId: input.dealId ?? null,
      listingId: input.listingId ?? null,
      fsboListingId: input.fsboListingId ?? null,
      role: input.role,
      hasConflict,
      conflictDescription,
      declarationLine,
    },
    select: { id: true },
  });

  logOaciqComplianceTagged.info("disclosure created", {
    brokerDisclosureId: row.id,
    brokerId: input.brokerId,
    dealId: input.dealId ?? null,
    listingId: input.listingId ?? null,
    fsboListingId: input.fsboListingId ?? null,
    role: input.role,
    hasConflict,
  });

  return row;
}

export async function findLatestBrokerDisclosure(input: {
  brokerId: string;
  dealId?: string | null;
  listingId?: string | null;
  fsboListingId?: string | null;
}) {
  const or: Array<Record<string, string>> = [];
  if (input.dealId) or.push({ dealId: input.dealId });
  if (input.listingId) or.push({ listingId: input.listingId });
  if (input.fsboListingId) or.push({ fsboListingId: input.fsboListingId });
  if (or.length === 0) return null;

  return prisma.brokerDisclosure.findFirst({
    where: { brokerId: input.brokerId, OR: or },
    orderBy: { disclosedAt: "desc" },
  });
}

export async function assertMandatoryBrokerDisclosurePresent(params: {
  brokerId: string | null | undefined;
  dealId?: string | null;
  listingId?: string | null;
  fsboListingId?: string | null;
  blockContext: string;
}): Promise<void> {
  if (!mandatoryBrokerDisclosureEnforced()) return;
  const brokerId = params.brokerId;
  if (!brokerId) return;

  const row = await findLatestBrokerDisclosure({
    brokerId,
    dealId: params.dealId,
    listingId: params.listingId,
    fsboListingId: params.fsboListingId,
  });
  if (row) return;

  logOaciqComplianceTagged.warn("disclosure missing (blocked)", {
    brokerId,
    dealId: params.dealId ?? null,
    listingId: params.listingId ?? null,
    fsboListingId: params.fsboListingId ?? null,
    context: params.blockContext,
  });
  throw new MandatoryBrokerDisclosureError(
    "Mandatory broker disclosure is required. File it via POST /api/compliance/oaciq/broker-disclosure before this action.",
  );
}

/** Resolve CRM vs FSBO listing id for marketplace offer flows. */
/** CRM listing owner, or FSBO row when broker holds inventory. */
export async function resolveResponsibleBrokerForMarketplaceListing(listingId: string): Promise<string | null> {
  const crm = await resolveResponsibleBrokerIdForCrmListing(listingId);
  if (crm) return crm;
  const fsbo = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, listingOwnerType: true },
  });
  if (fsbo?.listingOwnerType === "BROKER") return fsbo.ownerId;
  return null;
}

export async function classifyListingRef(
  listingId: string,
): Promise<{ kind: "crm"; id: string } | { kind: "fsbo"; id: string } | null> {
  const crm = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (crm) return { kind: "crm", id: listingId };
  const fsbo = await prisma.fsboListing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (fsbo) return { kind: "fsbo", id: listingId };
  return null;
}

/**
 * Before an offer: responsible broker must have filed disclosure for the listing (CRM or FSBO scope).
 */
export async function assertMandatoryBrokerDisclosureForOfferPath(input: {
  brokerId: string | null | undefined;
  listingId: string;
}): Promise<void> {
  if (!mandatoryBrokerDisclosureEnforced() || !input.brokerId) return;
  const ref = await classifyListingRef(input.listingId);
  if (!ref) return;
  if (ref.kind === "crm") {
    await assertMandatoryBrokerDisclosurePresent({
      brokerId: input.brokerId,
      listingId: ref.id,
      blockContext: "offer_submit_crm_listing",
    });
  } else {
    await assertMandatoryBrokerDisclosurePresent({
      brokerId: input.brokerId,
      fsboListingId: ref.id,
      blockContext: "offer_submit_fsbo_listing",
    });
  }
}

export async function getBrokerDisclosureDeclarationForDeal(dealId: string): Promise<string | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { brokerId: true, listingId: true },
  });
  if (!deal?.brokerId) return null;

  const byDeal = await findLatestBrokerDisclosure({ brokerId: deal.brokerId, dealId });
  if (byDeal) return byDeal.declarationLine;

  if (!deal.listingId) return null;
  const ref = await classifyListingRef(deal.listingId);
  if (!ref) return null;
  if (ref.kind === "crm") {
    const d = await findLatestBrokerDisclosure({ brokerId: deal.brokerId, listingId: ref.id });
    return d?.declarationLine ?? null;
  }
  const d = await findLatestBrokerDisclosure({ brokerId: deal.brokerId, fsboListingId: ref.id });
  return d?.declarationLine ?? null;
}

export async function getBrokerDisclosureStatusForDeal(dealId: string): Promise<{
  provided: boolean;
  declarationLine: string | null;
  disclosedAt: Date | null;
}> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { brokerId: true, listingId: true },
  });
  if (!deal?.brokerId) {
    return { provided: false, declarationLine: null, disclosedAt: null };
  }

  const byDeal = await findLatestBrokerDisclosure({ brokerId: deal.brokerId, dealId });
  if (byDeal) {
    return { provided: true, declarationLine: byDeal.declarationLine, disclosedAt: byDeal.disclosedAt };
  }

  if (deal.listingId) {
    const ref = await classifyListingRef(deal.listingId);
    if (ref?.kind === "crm") {
      const d = await findLatestBrokerDisclosure({ brokerId: deal.brokerId, listingId: ref.id });
      if (d) return { provided: true, declarationLine: d.declarationLine, disclosedAt: d.disclosedAt };
    } else if (ref?.kind === "fsbo") {
      const d = await findLatestBrokerDisclosure({ brokerId: deal.brokerId, fsboListingId: ref.id });
      if (d) return { provided: true, declarationLine: d.declarationLine, disclosedAt: d.disclosedAt };
    }
  }

  return { provided: false, declarationLine: null, disclosedAt: null };
}
