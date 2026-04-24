import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { recordSignal } from "../services/user-preference-signal.service";
import { updateJourneyState } from "../services/user-journey.service";

/**
 * Product-only CRM signals (listing interest, pipeline position). No protected traits.
 * Behavioral by default with low weight — explicit Dream Home / API beats this. Never throws.
 */
export async function recordListingInquiryTouch(
  userId: string,
  input: { listingId: string; flow: "fsbo" | "crm" },
): Promise<void> {
  try {
    if (!userId?.trim()) {
      return;
    }
    void (await recordSignal({
      userId,
      sourceDomain: "LEADS",
      sourceType: "listing_inquiry",
      sourceId: input.listingId,
      signalKey: "crm_listing_interest",
      signalValue: { listingId: input.listingId, flow: input.flow },
      explicitUserProvided: false,
      derivedFromBehavior: true,
      confidence: 0.45,
      signalWeight: 0.35,
    }));
    void (await updateJourneyState({
      userId,
      currentDomain: "LEADS",
      currentStage: "inquiry_sent",
      currentIntent: "listing_contact",
    }));
  } catch (e) {
    playbookLog.warn("user_intelligence: crm_inquiry", { message: e instanceof Error ? e.message : String(e) });
  }
}

/**
 * Buyer saved a listing — product-only affinity (city, property type, id). Never throws.
 */
export async function recordListingSaveEngagement(
  userId: string,
  input: { listingId: string; city?: string | null; propertyType?: string | null },
): Promise<void> {
  try {
    if (!userId?.trim()) {
      return;
    }
    void (await recordSignal({
      userId,
      sourceDomain: "LISTINGS",
      sourceType: "listing_save",
      sourceId: input.listingId,
      signalKey: "saved_listing_affinity",
      signalValue: {
        listingId: input.listingId,
        city: input.city ?? null,
        propertyType: input.propertyType ?? null,
      },
      explicitUserProvided: false,
      derivedFromBehavior: true,
      confidence: 0.5,
      signalWeight: 0.35,
    }));
    void (await updateJourneyState({
      userId,
      currentDomain: "LISTINGS",
      currentStage: "saved_listing",
      latestCity: input.city?.trim() || undefined,
      touchActivityAt: true,
    }));
  } catch (e) {
    playbookLog.warn("user_intelligence: listing_save", { message: e instanceof Error ? e.message : String(e) });
  }
}

/** LECIPM-style pipeline deal stage change for the assignee user. Never throws. */
export async function recordPipelineDealProgression(
  userId: string,
  input: { dealId: string; fromStage: string; toStage: string },
): Promise<void> {
  try {
    if (!userId?.trim()) {
      return;
    }
    void (await recordSignal({
      userId,
      sourceDomain: "DEALS",
      sourceType: "pipeline_stage",
      sourceId: input.dealId,
      signalKey: "deal_pipeline_stage",
      signalValue: { dealId: input.dealId, from: input.fromStage, to: input.toStage },
      explicitUserProvided: false,
      derivedFromBehavior: true,
      confidence: 0.5,
      signalWeight: 0.4,
    }));
    void (await updateJourneyState({
      userId,
      currentDomain: "BROKERAGE",
      currentStage: input.toStage,
      currentIntent: "deal_pipeline",
    }));
  } catch (e) {
    playbookLog.warn("user_intelligence: deal_progression", { message: e instanceof Error ? e.message : String(e) });
  }
}

/**
 * Broker CRM (internal) lead status change — enum ids only, no PII. Never throws.
 */
export async function recordBrokerCrmLeadStatusSignal(
  brokerUserId: string,
  input: { leadId: string; fromStatus: string | null; toStatus: string },
): Promise<void> {
  try {
    if (!brokerUserId?.trim()) {
      return;
    }
    void (await recordSignal({
      userId: brokerUserId,
      sourceDomain: "LEADS",
      sourceType: "broker_crm_lead",
      sourceId: input.leadId,
      signalKey: "broker_crm_lead_status",
      signalValue: { leadId: input.leadId, from: input.fromStatus, to: input.toStatus },
      explicitUserProvided: false,
      derivedFromBehavior: true,
      confidence: 0.45,
      signalWeight: 0.35,
    }));
    void (await updateJourneyState({
      userId: brokerUserId,
      currentDomain: "LEADS",
      currentStage: input.toStatus,
      currentIntent: "broker_crm",
      touchActivityAt: true,
    }));
  } catch (e) {
    playbookLog.warn("user_intelligence: broker_crm_status", { message: e instanceof Error ? e.message : String(e) });
  }
}

/**
 * Marketplace Deal CRM stage (product pipeline). Coarse stages only. Never throws.
 */
export async function recordMarketplaceDealCrmStageSignal(
  brokerUserId: string,
  input: { dealId: string; fromStage: string | null; toStage: string | null },
): Promise<void> {
  try {
    if (!brokerUserId?.trim()) {
      return;
    }
    void (await recordSignal({
      userId: brokerUserId,
      sourceDomain: "DEALS",
      sourceType: "marketplace_deal_crm",
      sourceId: input.dealId,
      signalKey: "marketplace_deal_crm_stage",
      signalValue: {
        dealId: input.dealId,
        from: input.fromStage,
        to: input.toStage,
      },
      explicitUserProvided: false,
      derivedFromBehavior: true,
      confidence: 0.5,
      signalWeight: 0.4,
    }));
    void (await updateJourneyState({
      userId: brokerUserId,
      currentDomain: "BROKERAGE",
      currentStage: input.toStage ?? "deal_crm",
      currentIntent: "deal_crm",
      touchActivityAt: true,
    }));
  } catch (e) {
    playbookLog.warn("user_intelligence: marketplace_deal_crm", { message: e instanceof Error ? e.message : String(e) });
  }
}

/**
 * Marketplace Lead pipeline (broker-facing). Stage labels only. Never throws.
 */
export async function recordMarketplaceLeadPipelineSignal(
  brokerUserId: string,
  input: { leadId: string; fromStage: string; toStage: string },
): Promise<void> {
  try {
    if (!brokerUserId?.trim()) {
      return;
    }
    void (await recordSignal({
      userId: brokerUserId,
      sourceDomain: "LEADS",
      sourceType: "marketplace_lead_pipeline",
      sourceId: input.leadId,
      signalKey: "marketplace_lead_pipeline_stage",
      signalValue: { leadId: input.leadId, from: input.fromStage, to: input.toStage },
      explicitUserProvided: false,
      derivedFromBehavior: true,
      confidence: 0.45,
      signalWeight: 0.35,
    }));
    void (await updateJourneyState({
      userId: brokerUserId,
      currentDomain: "LEADS",
      currentStage: input.toStage,
      currentIntent: "lead_pipeline",
      touchActivityAt: true,
    }));
  } catch (e) {
    playbookLog.warn("user_intelligence: marketplace_lead_pipeline", { message: e instanceof Error ? e.message : String(e) });
  }
}

/**
 * Marketplace Lead note logged in CRM — counts interaction only (no note body). Never throws.
 */
export async function recordMarketplaceLeadNoteSignal(brokerUserId: string, input: { leadId: string }): Promise<void> {
  try {
    if (!brokerUserId?.trim()) {
      return;
    }
    void (await recordSignal({
      userId: brokerUserId,
      sourceDomain: "LEADS",
      sourceType: "marketplace_lead_note",
      sourceId: input.leadId,
      signalKey: "crm_lead_note_interaction",
      signalValue: { leadId: input.leadId },
      explicitUserProvided: false,
      derivedFromBehavior: true,
      confidence: 0.35,
      signalWeight: 0.25,
    }));
    void (await updateJourneyState({
      userId: brokerUserId,
      currentDomain: "LEADS",
      currentStage: "note_added",
      currentIntent: "lead_crm_touch",
      touchActivityAt: true,
    }));
  } catch (e) {
    playbookLog.warn("user_intelligence: marketplace_lead_note", { message: e instanceof Error ? e.message : String(e) });
  }
}
