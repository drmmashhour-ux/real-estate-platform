import posthog from "posthog-js";

let initialized = false;

function getHost(): string {
  return (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, "");
}

/** Idempotent client init — safe when key is missing (no-op). */
export function initPosthog(): void {
  if (typeof window === "undefined") return;
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return;
  posthog.init(key, {
    api_host: getHost(),
    person_profiles: "identified_only",
    capture_pageview: false,
    persistence: "localStorage+cookie",
  });
  initialized = true;
}

export default posthog;
