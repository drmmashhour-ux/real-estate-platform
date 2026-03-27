import posthog, { initPosthog } from "@/lib/posthogClient";

/** Call after a successful login/session so funnels tie to the same person. */
export function identifyUser(user: { id: string; email?: string }): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()) return;
  if (!user.id?.trim()) return;
  try {
    initPosthog();
    posthog.identify(user.id, user.email ? { email: user.email } : {});
  } catch {
    /* ignore */
  }
}
