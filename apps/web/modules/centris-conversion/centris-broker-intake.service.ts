import { LeadContactOrigin } from "@prisma/client";

import { prisma } from "@/lib/db";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";

import { logFunnel, logLead } from "./centris-funnel.log";
import { recordLeadFunnelEvent } from "./lead-timeline.service";

/**
 * When a broker records an inquiry that originated on Centris (syndication) and should
 * appear in the same pipeline as `?src=centris` web traffic.
 * Law 25: `brokerAttestsConsent` = broker confirms they have a lawful basis to provide the contact.
 */
export async function createBrokerManualCentrisLead(params: {
  brokerUserId: string;
  listingId: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  brokerAttestsConsent: boolean;
}): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  if (!params.brokerAttestsConsent) {
    return { ok: false, error: "Attest that you may process this contact (Law 25 / PIPEDA-equivalent)." };
  }
  const email = params.email?.trim() ?? "";
  const phone = params.phone?.trim() ?? "";
  if (!email && !phone) {
    return { ok: false, error: "Provide an email or phone for the lead." };
  }
  const name = params.name?.trim() || "Centris inquiry";
  const message = params.notes?.trim()
    ? `[Centris · broker intake] ${params.notes.trim()}`
    : "[Centris · broker intake] Lead from Centris-originated inquiry; recorded by listing broker.";

  const hasRealEmail = Boolean(email);
  const emailStored = hasRealEmail ? email : `centris-manual-${Date.now()}@phone-only.invalid`;
  const phoneStored = phone || "—";

  try {
    const fsbo = await prisma.fsboListing.findUnique({
      where: { id: params.listingId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        priceCents: true,
        status: true,
      },
    });

    if (fsbo && fsbo.ownerId === params.brokerUserId && isFsboPubliclyVisible(fsbo)) {
      const dealVal = Math.round(fsbo.priceCents / 100);
      const lead = await prisma.lead.create({
        data: {
          name,
          email: emailStored,
          phone: phoneStored,
          message,
          status: "new",
          score: 58,
          pipelineStatus: "new",
          pipelineStage: "new",
          leadSource: "CENTRIS_BROKER_INTAKE",
          source: "centris_external_inquiry",
          distributionChannel: "CENTRIS",
          fsboListingId: fsbo.id,
          contactOrigin: LeadContactOrigin.PLATFORM_BROKER,
          commissionSource: LeadContactOrigin.PLATFORM_BROKER,
          firstPlatformContactAt: new Date(),
          commissionEligible: true,
          dealValue: dealVal,
          estimatedValue: dealVal,
          highIntent: true,
        },
      });

      await recordLeadFunnelEvent(lead.id, "CONTACT", {
        channel: "CENTRIS",
        intake: "broker_manual",
      });

      logFunnel("centris_broker_manual_fsbo", { leadId: lead.id, listingId: fsbo.id });
      logLead("broker_manual_created", { leadId: lead.id });
      return { ok: true, leadId: lead.id };
    }

    const crm = await prisma.listing.findUnique({
      where: { id: params.listingId },
      select: {
        id: true,
        title: true,
        listingCode: true,
        price: true,
        ownerId: true,
        crmMarketplaceLive: true,
      },
    });

    if (crm && crm.ownerId === params.brokerUserId && crm.crmMarketplaceLive) {
      const priceInt = Number.isFinite(crm.price) ? Math.round(crm.price) : null;
      const lead = await prisma.lead.create({
        data: {
          name,
          email: emailStored,
          phone: phoneStored,
          message,
          status: "new",
          score: 58,
          pipelineStatus: "new",
          pipelineStage: "new",
          leadSource: "CENTRIS_BROKER_INTAKE",
          source: "centris_external_inquiry",
          distributionChannel: "CENTRIS",
          listingId: crm.id,
          listingCode: crm.listingCode,
          contactOrigin: LeadContactOrigin.PLATFORM_BROKER,
          commissionSource: LeadContactOrigin.PLATFORM_BROKER,
          firstPlatformContactAt: new Date(),
          commissionEligible: true,
          highIntent: true,
          ...(priceInt != null ? { dealValue: priceInt, estimatedValue: priceInt } : {}),
        },
      });

      await recordLeadFunnelEvent(lead.id, "CONTACT", {
        channel: "CENTRIS",
        intake: "broker_manual",
      });

      logFunnel("centris_broker_manual_crm", { leadId: lead.id, listingId: crm.id });
      logLead("broker_manual_created", { leadId: lead.id });
      return { ok: true, leadId: lead.id };
    }

    return {
      ok: false,
      error: "Listing not found, not public, or not owned by your broker account.",
    };
  } catch (e) {
    logLead("broker_manual_error", { err: e instanceof Error ? e.message : "unknown" });
    return { ok: false, error: "Unable to save lead." };
  }
}
