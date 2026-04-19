/**
 * Lead capture landing — event attribution (same submission path as early leads).
 */

import { recordFastDealSourceEvent } from "@/modules/growth/fast-deal-results.service";

export async function logLandingPreviewShown(input: {
  marketVariant: string;
  actorUserId?: string | null;
}): Promise<{ id: string } | null> {
  return recordFastDealSourceEvent({
    sourceType: "landing_capture",
    sourceSubType: "landing_preview_shown",
    actorUserId: input.actorUserId,
    metadata: { marketVariant: input.marketVariant },
  });
}

export async function logLeadFormStarted(input: {
  marketVariant: string;
  actorUserId?: string | null;
}): Promise<{ id: string } | null> {
  return recordFastDealSourceEvent({
    sourceType: "landing_capture",
    sourceSubType: "lead_form_started",
    actorUserId: input.actorUserId,
    metadata: { marketVariant: input.marketVariant },
  });
}

export async function logLeadSubmitted(input: {
  marketVariant: string;
  formSubmissionId?: string | null;
  cta?: string;
  actorUserId?: string | null;
}): Promise<{ id: string } | null> {
  return recordFastDealSourceEvent({
    sourceType: "landing_capture",
    sourceSubType: "lead_submitted",
    actorUserId: input.actorUserId,
    metadata: {
      marketVariant: input.marketVariant,
      ...(input.formSubmissionId ? { formSubmissionId: input.formSubmissionId } : {}),
      ...(input.cta ? { cta: input.cta } : {}),
    },
  });
}
