/**
 * Safe entry points for routes — never throws; logs on failure.
 */

import { evaluateAndPersistFsboListing } from "./legal-orchestration.service";
import { legalEngineLog } from "./legal-logging";
import type { LegalEvaluationOutput } from "./legal-evaluation.types";

export async function safeRunFsboListingLegalCompliance(
  listingId: string,
  actorUserId: string | null,
  persistAlerts: boolean,
): Promise<LegalEvaluationOutput | null> {
  try {
    return await evaluateAndPersistFsboListing(listingId, actorUserId, persistAlerts);
  } catch (e) {
    legalEngineLog("safeRunFsboListingLegalCompliance failed", { listingId, error: String(e) });
    return null;
  }
}
