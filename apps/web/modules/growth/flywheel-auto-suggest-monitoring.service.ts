/**
 * Flywheel auto-suggest — read-only recommendation bundles.
 * Prefix: [growth:flywheel:auto-suggest]
 */

const P = "[growth:flywheel:auto-suggest]";

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '"[unserializable]"';
  }
}

export function monitorFlywheelSuccessProfilesBuilt(payload: { profiles: number }): void {
  try {
    console.info(`${P} success_profiles ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorFlywheelAutoSuggestBundleBuilt(payload: {
  suggestionCount: number;
  lowConfidenceCount: number;
  topCategories: string[];
}): void {
  try {
    console.info(`${P} bundle_built ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorFlywheelAutoSuggestLowConfidence(payload: { suggestionId: string }): void {
  try {
    console.warn(`${P} low_confidence ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}
