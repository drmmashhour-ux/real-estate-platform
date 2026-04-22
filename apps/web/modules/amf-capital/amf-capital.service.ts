import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import {
  assertDealOpenForInvestment,
  assertDisclosuresCompleteForDeal,
  assertInvestorAcknowledgedAllRequired,
  assertMarketingAllowed,
  assertPrivatePlacement,
  assessInvestorEligibility,
} from "./amf-compliance.service";
import { AMF_DISCLOSURE_OFFERING, AMF_DISCLOSURE_RISK } from "./amf.constants";

const TAG = "[amf-capital]";

export async function createCapitalDealWithSpv(input: {
  title: string;
  legalName: string;
  sponsorUserId: string | null;
  listingId?: string | null;
  solicitationMode?: string;
  allowsPublicMarketing?: boolean;
  exemptionNarrative?: string | null;
}) {
  const deal = await prisma.amfCapitalDeal.create({
    data: {
      title: input.title.slice(0, 512),
      listingId: input.listingId ?? undefined,
      sponsorUserId: input.sponsorUserId ?? undefined,
      solicitationMode: (input.solicitationMode ?? "PRIVATE_PLACEMENT").slice(0, 40),
      allowsPublicMarketing: input.allowsPublicMarketing ?? false,
      exemptionNarrative: input.exemptionNarrative ?? undefined,
      status: "DRAFT",
      spv: {
        create: {
          legalName: input.legalName.slice(0, 512),
        },
      },
    },
    include: { spv: true },
  });

  logInfo(TAG, { action: "create_deal", id: deal.id });
  return deal;
}

export async function setDealStatus(capitalDealId: string, status: string, actorUserId: string) {
  const deal = await prisma.amfCapitalDeal.findUnique({ where: { id: capitalDealId } });
  if (!deal) throw new Error("Deal not found");
  const actor = await prisma.user.findUnique({ where: { id: actorUserId }, select: { role: true } });
  const admin = actor?.role === "ADMIN";
  if (!admin && deal.sponsorUserId !== actorUserId) throw new Error("Forbidden");

  return prisma.amfCapitalDeal.update({
    where: { id: capitalDealId },
    data: { status: status.slice(0, 24) },
  });
}

/** Update marketing flags — applies exemption narrative gate when enabling public marketing. */
export async function updateDealComplianceFlags(
  capitalDealId: string,
  input: { allowsPublicMarketing?: boolean; exemptionNarrative?: string | null },
  actorUserId: string
) {
  const deal = await prisma.amfCapitalDeal.findUnique({ where: { id: capitalDealId } });
  if (!deal) throw new Error("Deal not found");
  const actor = await prisma.user.findUnique({ where: { id: actorUserId }, select: { role: true } });
  const admin = actor?.role === "ADMIN";
  if (!admin && deal.sponsorUserId !== actorUserId) throw new Error("Forbidden");

  const next = {
    ...deal,
    allowsPublicMarketing: input.allowsPublicMarketing ?? deal.allowsPublicMarketing,
    exemptionNarrative:
      input.exemptionNarrative !== undefined ? input.exemptionNarrative : deal.exemptionNarrative,
  };
  const m = assertMarketingAllowed(next);
  if (!m.ok) throw new Error(m.message);

  return prisma.amfCapitalDeal.update({
    where: { id: capitalDealId },
    data: {
      allowsPublicMarketing: input.allowsPublicMarketing ?? undefined,
      exemptionNarrative: input.exemptionNarrative ?? undefined,
    },
  });
}

export async function registerOrUpdateInvestor(input: {
  userId?: string | null;
  legalName: string;
  email: string;
  accreditationStatus?: string;
  kycStatus?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.amfInvestor.findUnique({ where: { email } });
  if (existing) {
    return prisma.amfInvestor.update({
      where: { id: existing.id },
      data: {
        legalName: input.legalName.slice(0, 512),
        accreditationStatus: input.accreditationStatus?.slice(0, 24),
        kycStatus: input.kycStatus?.slice(0, 24),
        userId: input.userId ?? undefined,
      },
    });
  }
  return prisma.amfInvestor.create({
    data: {
      email,
      legalName: input.legalName.slice(0, 512),
      userId: input.userId ?? undefined,
      accreditationStatus: input.accreditationStatus?.slice(0, 24) ?? "PENDING",
      kycStatus: input.kycStatus?.slice(0, 24) ?? "PENDING",
    },
  });
}

export async function addDealDisclosure(input: {
  capitalDealId: string;
  docType: string;
  title: string;
  storageUrl: string;
  version?: number;
}) {
  return prisma.amfDealDisclosure.create({
    data: {
      capitalDealId: input.capitalDealId,
      docType: input.docType.slice(0, 40),
      title: input.title.slice(0, 512),
      storageUrl: input.storageUrl,
      version: input.version ?? 1,
    },
  });
}

export async function acknowledgeDisclosure(input: {
  capitalDealId: string;
  investorId: string;
  disclosureId: string;
}) {
  const disc = await prisma.amfDealDisclosure.findFirst({
    where: { id: input.disclosureId, capitalDealId: input.capitalDealId },
  });
  if (!disc) throw new Error("Disclosure not found on this deal");

  return prisma.amfDisclosureAcknowledgment.upsert({
    where: {
      investorId_disclosureId: { investorId: input.investorId, disclosureId: input.disclosureId },
    },
    create: {
      capitalDealId: input.capitalDealId,
      investorId: input.investorId,
      disclosureId: input.disclosureId,
    },
    update: {},
  });
}

export async function subscribeInvestment(input: {
  capitalDealId: string;
  investorId: string;
  amount: number;
  equityPercentage?: number | null;
}) {
  const deal = await prisma.amfCapitalDeal.findUnique({ where: { id: input.capitalDealId } });
  if (!deal) throw new Error("Deal not found");

  const investor = await prisma.amfInvestor.findUnique({ where: { id: input.investorId } });
  if (!investor) throw new Error("Investor not found");

  const gateOpen = await assertDealOpenForInvestment(deal);
  if (!gateOpen.ok) throw new Error(gateOpen.message);

  const mk = assertMarketingAllowed(deal);
  if (!mk.ok) throw new Error(mk.message);

  const elig = assessInvestorEligibility(investor);
  if (!elig.ok) throw new Error(elig.message);

  const pp = assertPrivatePlacement(deal, investor);
  if (!pp.ok) throw new Error(pp.message);

  const discPack = await assertDisclosuresCompleteForDeal(input.capitalDealId);
  if (!discPack.ok) throw new Error(discPack.message);

  const acks = await assertInvestorAcknowledgedAllRequired(input.capitalDealId, input.investorId);
  if (!acks.ok) throw new Error(acks.message);

  const acknowledgedAt = new Date();

  const row = await prisma.amfInvestment.upsert({
    where: {
      capitalDealId_investorId: {
        capitalDealId: input.capitalDealId,
        investorId: input.investorId,
      },
    },
    create: {
      capitalDealId: input.capitalDealId,
      investorId: input.investorId,
      amount: input.amount,
      equityPercentage: input.equityPercentage ?? undefined,
      status: "CONFIRMED",
      disclosuresAcknowledgedAt: acknowledgedAt,
    },
    update: {
      amount: input.amount,
      equityPercentage: input.equityPercentage ?? undefined,
      status: "CONFIRMED",
      disclosuresAcknowledgedAt: acknowledgedAt,
    },
  });

  logInfo(TAG, { action: "subscribe", investmentId: row.id });
  return row;
}

export async function getCapitalDealDetail(id: string) {
  return prisma.amfCapitalDeal.findUnique({
    where: { id },
    include: {
      spv: true,
      listing: { select: { id: true, listingCode: true, title: true } },
      sponsor: { select: { id: true, email: true } },
      disclosures: { orderBy: { createdAt: "desc" } },
      investments: { include: { investor: true } },
    },
  });
}

/** Seed helper: attach required disclosure URLs (e.g. after upload to storage). */
export async function seedRequiredDisclosuresIfMissing(
  capitalDealId: string,
  urls: { riskUrl: string; offeringUrl: string }
) {
  const have = await prisma.amfDealDisclosure.findMany({ where: { capitalDealId } });
  const types = new Set(have.map((h) => h.docType));
  const out = [];
  if (!types.has(AMF_DISCLOSURE_RISK)) {
    out.push(
      await addDealDisclosure({
        capitalDealId,
        docType: AMF_DISCLOSURE_RISK,
        title: "Risk disclosure",
        storageUrl: urls.riskUrl,
      })
    );
  }
  if (!types.has(AMF_DISCLOSURE_OFFERING)) {
    out.push(
      await addDealDisclosure({
        capitalDealId,
        docType: AMF_DISCLOSURE_OFFERING,
        title: "Offering summary",
        storageUrl: urls.offeringUrl,
      })
    );
  }
  return out;
}
