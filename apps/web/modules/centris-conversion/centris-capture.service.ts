import { LeadContactOrigin } from "@prisma/client";

import { prisma } from "@/lib/db";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";

import { enrichCentrisLeadSnapshot } from "./centris-enrich.service";
import { sendCentrisAnalysisFollowUpEmail } from "./centris-followup.service";
import { logConversion, logFunnel, logLead } from "./centris-funnel.log";
import { recordLeadFunnelEvent } from "./lead-timeline.service";

export type CentrisCaptureIntent = "unlock_analysis" | "book_visit" | "download_report";

export async function captureCentrisLead(params: {
  listingId: string;
  name?: string;
  email?: string;
  phone?: string;
  consentMarketing: boolean;
  consentPrivacy: boolean;
  intent: CentrisCaptureIntent;
  userId: string | null;
}): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  const email = params.email?.trim() ?? "";
  const phone = params.phone?.trim() ?? "";
  if (!email && !phone) {
    return { ok: false, error: "Provide an email or phone number." };
  }
  if (!params.consentPrivacy) {
    return { ok: false, error: "Privacy acknowledgment required (Law 25)." };
  }

  const name = params.name?.trim() || "Centris visitor";
  const message = `[Centris funnel · ${params.intent}] Buyer requested follow-up from Centris-attributed listing traffic.`;
  const hasRealEmail = Boolean(email);
  const emailStored = hasRealEmail ? email : `centris-phone-${Date.now()}@phone-only.invalid`;
  const phoneStored = phone || "—";

  try {
    const fsbo = await prisma.fsboListing.findUnique({
      where: { id: params.listingId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        city: true,
        priceCents: true,
        status: true,
      },
    });

    if (fsbo && isFsboPubliclyVisible(fsbo)) {
      const dealVal = Math.round(fsbo.priceCents / 100);
      const lead = await prisma.lead.create({
        data: {
          name,
          email: email || `pending+${params.listingId}@lecipm.local`,
          phone: phone || "—",
          message,
          status: "new",
          score: 62,
          pipelineStatus: "new",
          pipelineStage: "new",
          leadSource: "CENTRIS_FUNNEL",
          source: "centris_portal",
          distributionChannel: "CENTRIS",
          userId: params.userId ?? undefined,
          fsboListingId: fsbo.id,
          contactOrigin: LeadContactOrigin.DIRECT,
          commissionSource: LeadContactOrigin.DIRECT,
          firstPlatformContactAt: new Date(),
          commissionEligible: true,
          dealValue: dealVal,
          estimatedValue: dealVal,
          highIntent: true,
        },
      });

      await recordLeadFunnelEvent(lead.id, "CONTACT", {
        intent: params.intent,
        channel: "CENTRIS",
      });

      logFunnel("centris_capture_fsbo", { leadId: lead.id, listingId: fsbo.id });
      logLead("created", { leadId: lead.id, channel: "CENTRIS" });

      if (hasRealEmail && params.consentMarketing) {
        void sendCentrisAnalysisFollowUpEmail({
          toEmail: emailStored,
          leadId: lead.id,
          listingTitle: fsbo.title,
        });
      }

      void enrichCentrisLeadSnapshot(lead.id).then((snap) => {
        logConversion("enrich_attached", { leadId: lead.id, peers: snap.similarListingIds.length });
      });

      return { ok: true, leadId: lead.id };
    }

    const crm = await prisma.listing.findUnique({
      where: { id: params.listingId },
      select: { id: true, title: true, listingCode: true, price: true, ownerId: true, crmMarketplaceLive: true },
    });

    if (crm && crm.crmMarketplaceLive) {
      const priceInt = Number.isFinite(crm.price) ? Math.round(crm.price) : null;
      const lead = await prisma.lead.create({
        data: {
          name,
          email: emailStored,
          phone: phoneStored,
          message,
          status: "new",
          score: 62,
          pipelineStatus: "new",
          pipelineStage: "new",
          leadSource: "CENTRIS_FUNNEL",
          source: "centris_portal",
          distributionChannel: "CENTRIS",
          listingId: crm.id,
          listingCode: crm.listingCode,
          userId: params.userId ?? undefined,
          contactOrigin: LeadContactOrigin.DIRECT,
          commissionSource: LeadContactOrigin.DIRECT,
          firstPlatformContactAt: new Date(),
          commissionEligible: true,
          highIntent: true,
          ...(priceInt != null ? { dealValue: priceInt, estimatedValue: priceInt } : {}),
        },
      });

      await recordLeadFunnelEvent(lead.id, "CONTACT", {
        intent: params.intent,
        channel: "CENTRIS",
      });

      logFunnel("centris_capture_crm", { leadId: lead.id, listingId: crm.id });

      if (hasRealEmail && params.consentMarketing) {
        void sendCentrisAnalysisFollowUpEmail({
          toEmail: emailStored,
          leadId: lead.id,
          listingTitle: crm.title,
        });
      }

      void enrichCentrisLeadSnapshot(lead.id).then((snap) => {
        logConversion("enrich_attached", { leadId: lead.id, peers: snap.similarListingIds.length });
      });

      return { ok: true, leadId: lead.id };
    }

    return { ok: false, error: "Listing not found or not public." };
  } catch (e) {
    logLead("capture_error", { err: e instanceof Error ? e.message : "unknown" });
    return { ok: false, error: "Unable to save lead." };
  }
}
