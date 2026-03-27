/**
 * User-facing copy when the model is offline, rate-limited, or errors — never block the page.
 */

export const AI_SIGN_IN_REQUIRED =
  "Sign in to use AI assistance on this screen. You can still browse listings and complete actions manually.";

export const AI_RATE_LIMITED = "Too many AI requests right now. Try again in a few minutes — your workflow stays available.";

export const AI_PROVIDER_UNAVAILABLE =
  "AI is temporarily unavailable. Continue with the forms and data on this page; nothing here requires AI to proceed.";

export const AI_CRITICAL_ACTION_NOTICE =
  "AI never auto-submits payments, payouts, disputes, contracts, or legal steps — always confirm in the platform.";

/** Map API JSON error to a short string for inline display. */
export function messageFromAiApiError(
  res: Response,
  body: unknown
): string {
  if (res.status === 401) return AI_SIGN_IN_REQUIRED;
  if (res.status === 429) return AI_RATE_LIMITED;
  if (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string") {
    return (body as { error: string }).error;
  }
  return AI_PROVIDER_UNAVAILABLE;
}
