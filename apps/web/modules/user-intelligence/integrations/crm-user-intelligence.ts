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
 * Broker / assignee user when a pipeline deal stage changes. Product workflow only. Never throws.
 */
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
