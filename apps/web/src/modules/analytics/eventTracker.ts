/**
 * Client-safe analytics: POST to `/api/track-event` only (no `@/lib/db` / Prisma).
 *
 * Browser: relative `/api/track-event`.
 * Server (cron, tooling): absolute URL from `NEXT_PUBLIC_APP_URL` or `VERCEL_URL`; if unset, skips (no localhost hardcoding).
 */

export type LiveDebugMetadata = Record<string, unknown>;

export function isLiveDebugMode(): boolean {
  return false;
}

function resolveTrackEventUrl(): string | null {
  const isBrowser = typeof window !== "undefined";

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "";

  if (isBrowser) {
    return "/api/track-event";
  }
  if (!baseUrl.trim()) {
    return null;
  }
  return `${baseUrl.replace(/\/$/, "")}/api/track-event`;
}

export async function trackEvent(
  eventName: string,
  data?: Record<string, unknown>,
  context?: Record<string, unknown>,
): Promise<void> {
  try {
    const url = resolveTrackEventUrl();
    if (!url) return;

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify({
        eventName,
        data: data ?? {},
        context: context ?? {},
      }),
    }).catch(() => {});
  } catch {
    // Analytics must never break UX
  }
}

export async function trackErrorEvent(
  errorType: string,
  message?: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    const url = resolveTrackEventUrl();
    if (!url) return;

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify({
        kind: "error",
        errorType,
        message: message ?? "",
        metadata: meta ?? {},
      }),
    }).catch(() => {});
  } catch {
    // swallow
  }
}

export function logBusinessMilestone(label: string, meta?: Record<string, unknown>): void {
  void trackEvent(`business_milestone:${label}`, meta ?? {});
}

export async function writeMarketplaceEvent(
  eventName: string,
  data?: Record<string, unknown>,
  context?: Record<string, unknown>,
): Promise<void> {
  await trackEvent(eventName, data, context);
}
