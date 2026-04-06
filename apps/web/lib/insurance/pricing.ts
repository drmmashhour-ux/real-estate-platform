import { Prisma } from "@prisma/client";
import type { InsuranceLead, InsurancePartner } from "@prisma/client";
import { scoreInsuranceLead, type LeadScoreInput } from "@/lib/insurance/score-lead";

/** Leads with score strictly greater than this earn `bonusHighQualityLead`. */
export const INSURANCE_HIGH_QUALITY_SCORE_THRESHOLD = 15;

type PartnerPricing = Pick<
  InsurancePartner,
  "fixedPricePerLead" | "basePricePerLead" | "bonusHighQualityLead"
>;

function partnerBase(p: PartnerPricing): Prisma.Decimal {
  return p.basePricePerLead ?? p.fixedPricePerLead ?? new Prisma.Decimal(0);
}

export function calculateLeadValue(lead: LeadScoreInput & { leadScore?: number }, partner: PartnerPricing | null): Prisma.Decimal {
  const score =
    typeof lead.leadScore === "number" && Number.isFinite(lead.leadScore)
      ? lead.leadScore
      : scoreInsuranceLead(lead);
  if (!partner) return new Prisma.Decimal(0);
  const base = partnerBase(partner);
  const bonus = partner.bonusHighQualityLead ?? new Prisma.Decimal(0);
  if (score > INSURANCE_HIGH_QUALITY_SCORE_THRESHOLD) {
    return new Prisma.Decimal(base.toString()).plus(new Prisma.Decimal(bonus.toString()));
  }
  return new Prisma.Decimal(base.toString());
}

/** Revenue to record when marking a lead converted: prefer stored estimate, else recalculate from partner + fields. */
export function resolveLeadRevenueAmount(
  lead: Pick<InsuranceLead, "estimatedValue" | "leadScore" | "phone" | "bookingId" | "source" | "leadType" | "listingId"> & {
    partner: PartnerPricing | null;
  }
): Prisma.Decimal {
  if (lead.estimatedValue != null) {
    const ev = new Prisma.Decimal(lead.estimatedValue.toString());
    if (ev.gt(0)) return ev;
  }
  return calculateLeadValue(
    {
      phone: lead.phone,
      bookingId: lead.bookingId,
      source: lead.source,
      leadType: lead.leadType,
      listingId: lead.listingId,
      leadScore: lead.leadScore,
    },
    lead.partner
  );
}
