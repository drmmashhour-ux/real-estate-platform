/**
 * Runway Gen-4 (or compatible) — vertical 9:16 short video from image + prompt.
 * Wire RUNWAY_API_KEY and optional RUNWAY_API_BASE when ready.
 */

export type RunwayVideoRequest = {
  prompt: string;
  imageUrl: string;
  /** seconds, platform-typical 5–15 */
  durationSec?: number;
};

export type RunwayVideoResult =
  | { ok: true; videoUrl: string; thumbnailUrl?: string; providerTaskId?: string }
  | { ok: false; error: string };

export async function generateVideoWithRunway(req: RunwayVideoRequest): Promise<RunwayVideoResult> {
  const key = process.env.RUNWAY_API_KEY?.trim();
  if (!key || key === "your_key_here") {
    return { ok: false, error: "RUNWAY_API_KEY not configured" };
  }

  const base = process.env.RUNWAY_API_BASE?.trim() || "https://api.dev.runwayml.com";
  try {
    // Placeholder: replace with official Runway REST contract for your account tier.
    const res = await fetch(`${base}/v1/video/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: req.prompt,
        image_url: req.imageUrl,
        ratio: "9:16",
        duration: req.durationSec ?? 8,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: `Runway HTTP ${res.status}: ${t.slice(0, 200)}` };
    }
    const data = (await res.json()) as { video_url?: string; url?: string; id?: string; thumbnail_url?: string };
    const videoUrl = data.video_url ?? data.url;
    if (!videoUrl) {
      return { ok: false, error: "Runway response missing video URL (stub endpoint may need real path)" };
    }
    return {
      ok: true,
      videoUrl,
      thumbnailUrl: data.thumbnail_url,
      providerTaskId: data.id,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Runway request failed" };
  }
}
