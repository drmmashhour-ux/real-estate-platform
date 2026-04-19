/**
 * [weekly-review] — best-effort, never throws.
 */

const P = "[weekly-review]";

export function logWeeklyTeamReviewBuilt(params: { windowDays: number; confidence: string; lowData: boolean }): void {
  try {
    console.info(
      `${P} team-review window=${params.windowDays} conf=${params.confidence} lowData=${params.lowData}`,
    );
  } catch {
    /* ignore */
  }
}

export function logWeeklyTeamReviewSummaryError(err: unknown): void {
  try {
    console.info(`${P} build-fail ${err instanceof Error ? err.message : String(err)}`);
  } catch {
    /* ignore */
  }
}
