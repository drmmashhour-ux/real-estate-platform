/**
 * Client beacon: POST `/api/launch/track`. Server pages should import `persistLaunchEvent`
 * directly — do not add server-only imports here or they pull `lib/db` into client bundles.
 */
export async function trackLaunchEvent(event: string, payload: Record<string, unknown> = {}): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }
  try {
    await fetch("/api/launch/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
      credentials: "same-origin",
    });
  } catch {
    /* non-blocking */
  }
}
