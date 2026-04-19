/**
 * Console monitoring for flywheel actions & outcomes — never throws.
 * Prefix: [growth:flywheel]
 */

const P = "[growth:flywheel]";

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '"[unserializable]"';
  }
}

export function monitorFlywheelActionCreated(payload: {
  actionId: string;
  type: string;
  insightId: string;
  actorUserId: string;
}): void {
  try {
    console.info(`${P} action_created ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorFlywheelActionStatusUpdated(payload: {
  actionId: string;
  status: string;
  actorUserId?: string;
}): void {
  try {
    console.info(`${P} action_status ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorFlywheelOutcomeEvaluated(payload: {
  actionId: string;
  outcomeScore: string;
  measuredAt: string;
}): void {
  try {
    console.info(`${P} outcome_evaluated ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorFlywheelOutcomeScoreBucket(payload: { outcomeScore: string; countDelta: number }): void {
  try {
    console.info(`${P} outcome_bucket ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}
