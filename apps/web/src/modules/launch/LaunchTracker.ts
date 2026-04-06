/**
 * Client: POST /api/launch/track. Server: use `persistLaunchEvent` directly to avoid self-HTTP.
 */
export async function trackLaunchEvent(event: string, payload: Record<string, unknown> = {}): Promise<void> {
  if (typeof window === "undefined") {
    const { persistLaunchEvent } = await import("./persistLaunchEvent");
    await persistLaunchEvent(event, payload);
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
