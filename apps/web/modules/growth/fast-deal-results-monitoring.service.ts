/**
 * Fast Deal results loop — structured logs only; never throws.
 * Prefix: [fast-deal]
 */

const P = "[fast-deal]";

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '"[unserializable]"';
  }
}

export function monitorFastDealSourceEventLogged(payload: {
  sourceType: string;
  sourceSubType: string;
  id?: string;
}): void {
  try {
    console.info(`${P} source_event ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorFastDealOutcomeLogged(payload: { outcomeType: string; id?: string }): void {
  try {
    console.info(`${P} outcome ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorFastDealSummaryBuilt(payload: {
  sourceEvents: number;
  outcomes: number;
  sparseLevel: string;
}): void {
  try {
    console.info(`${P} summary_built ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorFastDealSparseData(payload: { reason: string; totals: number }): void {
  try {
    console.warn(`${P} sparse_data ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}
