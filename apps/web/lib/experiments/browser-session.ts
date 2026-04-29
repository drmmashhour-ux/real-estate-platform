import "server-only";

import { cookies, headers } from "next/headers";
import { EXPERIMENT_SESSION_COOKIE_NAME, EXPERIMENT_SESSION_HEADER } from "@/lib/experiments/constants";

/**
 * Stable per-browser id for experiment assignment. Prefer middleware-injected header so the
 * first SSR paint matches the persisted cookie without flicker.
 */
export async function getExperimentBrowserSessionId(): Promise<string> {
  const h = await headers();
  const fromHeader = h.get(EXPERIMENT_SESSION_HEADER)?.trim();
  if (fromHeader && fromHeader.length >= 8) return fromHeader;

  const c = await cookies();
  const fromCookie = c.get(EXPERIMENT_SESSION_COOKIE_NAME)?.value?.trim();
  if (fromCookie && fromCookie.length >= 8) return fromCookie;

  return crypto.randomUUID();
}
