import type { Deal } from "@prisma/client";
import { prisma } from "@/lib/db";
import { resolveShortTermListingRef } from "@/lib/listing-code";
import { generateDealCode } from "@/lib/codes/generate-code";
import { conversionLog } from "./crm-pipeline-logger";
import {
  assertMandatoryBrokerDisclosurePresent,
  classifyListingRef,
} from "@/lib/compliance/oaciq/broker-mandatory-disclosure.service";

export type ConverterResult =
  | { ok: true; deal: Deal }
  | { ok: false; reason: string };

/**
 * Creates a **`Deal`** from a **`LecipmBrokerCrmLead`** when BNHub listing context resolves and buyer maps to a user.
 * Residential-only listing flows may require a different orchestration — returns explicit `reason` instead of guessing.
 */
export async function convertBrokerCrmLeadToDeal(params: {
  brokerCrmLeadId: string;
  brokerUserId: string;
  /** Expected offer / working price — dollars, stored as cents on Deal */
  priceDollars: number;
}): Promise<ConverterResult> {
  const lead = await prisma.lecipmBrokerCrmLead.findFirst({
    where: { id: params.brokerCrmLeadId, brokerUserId: params.brokerUserId },
    include: {
      listing: { select: { id: true, listingCode: true } },
      customer: { select: { id: true, email: true } },
    },
  });

  if (!lead) {
    conversionLog.warn("convertBrokerCrmLeadToDeal_missing_lead", { id: params.brokerCrmLeadId });
    return { ok: false, reason: "lead_not_found" };
  }

  if (!lead.listing?.id) {
    conversionLog.warn("convertBrokerCrmLeadToDeal_no_listing", { leadId: lead.id });
    return { ok: false, reason: "listing_required_for_bnhub_deal" };
  }

  if (!lead.customer?.id || !lead.customer.email) {
    conversionLog.warn("convertBrokerCrmLeadToDeal_no_registered_buyer", { leadId: lead.id });
    return { ok: false, reason: "registered_buyer_required" };
  }

  const resolved = await resolveShortTermListingRef(lead.listing.listingCode ?? lead.listing.id);
  if (!resolved) {
    conversionLog.warn("convertBrokerCrmLeadToDeal_listing_not_short_term", {
      listingId: lead.listing.id,
    });
    return { ok: false, reason: "short_term_listing_only_in_v1" };
  }

  const listingRow = await prisma.shortTermListing.findUnique({
    where: { id: resolved.id },
    select: { id: true, ownerId: true, listingCode: true },
  });
  if (!listingRow) return { ok: false, reason: "listing_resolve_failed" };

  const sellerId = listingRow.ownerId;
  const buyerId = lead.customer.id;
  if (buyerId === sellerId) return { ok: false, reason: "buyer_and_seller_same_party" };

  const priceCents = Math.round(Math.max(0, params.priceDollars) * 100);

  try {
    const ref = await classifyListingRef(listingRow.id);
    if (ref?.kind === "crm") {
      await assertMandatoryBrokerDisclosurePresent({
        brokerId: params.brokerUserId,
        listingId: ref.id,
        blockContext: "residential_deal_create_bnhub_lead",
      });
    } else if (ref?.kind === "fsbo") {
      await assertMandatoryBrokerDisclosurePresent({
        brokerId: params.brokerUserId,
        fsboListingId: ref.id,
        blockContext: "residential_deal_create_bnhub_lead_fsbo",
      });
    }

    const deal = await prisma.$transaction(async (tx) => {
      const dealCode = await generateDealCode(tx);
      return tx.deal.create({
        data: {
          dealCode,
          buyerId,
          sellerId,
          brokerId: params.brokerUserId,
          listingId: listingRow.id,
          listingCode: listingRow.listingCode ?? resolved.listingCode,
          priceCents,
          status: "initiated",
          crmStage: "negotiation",
          intelligenceStage: "NEGOTIATION",
        },
      });
    });

    await prisma.lecipmBrokerCrmLead.update({
      where: { id: params.brokerCrmLeadId },
      data: { status: "negotiating" },
    });

    conversionLog.info("convertBrokerCrmLeadToDeal_created", {
      dealId: deal.id,
      leadId: params.brokerCrmLeadId,
    });

    return { ok: true, deal };
  } catch (e) {
    conversionLog.error("convertBrokerCrmLeadToDeal_failed", {
      message: e instanceof Error ? e.message : String(e),
      leadId: params.brokerCrmLeadId,
    });
    return { ok: false, reason: "deal_create_failed" };
  }
}
