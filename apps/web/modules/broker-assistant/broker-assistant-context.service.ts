import { randomUUID } from "crypto";
import type { BrokerAssistantContext, BrokerAssistantDocumentType, BrokerAssistantLanguagePreference } from "@/modules/broker-assistant/broker-assistant.types";

export type BuildContextInput = Partial<BrokerAssistantContext> & {
  documentType?: BrokerAssistantDocumentType;
  languagePreference?: BrokerAssistantLanguagePreference;
};

/**
 * Normalizes caller-supplied fields into a full `BrokerAssistantContext`.
 * For DB-backed enrichment, call `enrichBrokerAssistantContextFromDeal` separately.
 */
export function buildBrokerAssistantContext(input: BuildContextInput): BrokerAssistantContext {
  const caseId = input.caseId ?? randomUUID();
  return {
    caseId,
    dealId: input.dealId,
    listingId: input.listingId,
    documentType: input.documentType ?? "other",
    transactionMode: input.transactionMode ?? "unknown",
    offerStatus: input.offerStatus ?? "unknown",
    languagePreference: input.languagePreference ?? "BILINGUAL",
    listing: input.listing,
    parties: input.parties ?? [],
    broker: input.broker,
    conditions: input.conditions,
    dates: input.dates,
    inclusionsExclusions: input.inclusionsExclusions,
    disclosures: input.disclosures,
    conflict: input.conflict,
    fsboContext: input.fsboContext,
    currentDraftText: input.currentDraftText,
    isPublicOrClientFacing: input.isPublicOrClientFacing,
    metadata: input.metadata,
  };
}
