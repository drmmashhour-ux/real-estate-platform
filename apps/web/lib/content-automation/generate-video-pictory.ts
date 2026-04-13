/**
 * Pictory (or similar) text + images → video fallback when Runway fails or is disabled.
 */

export type PictoryVideoRequest = {
  script: string;
  imageUrls: string[];
  aspectRatio?: "9:16";
};

export type PictoryVideoResult =
  | { ok: true; videoUrl: string; providerJobId?: string }
  | { ok: false; error: string };

export async function generateVideoWithPictory(req: PictoryVideoRequest): Promise<PictoryVideoResult> {
  const key = process.env.PICTORY_API_KEY?.trim();
  if (!key) {
    return { ok: false, error: "PICTORY_API_KEY not configured" };
  }

  const base = process.env.PICTORY_API_BASE?.trim() || "https://api.pictory.ai";
  try {
    const res = await fetch(`${base}/v2/video/storyboard`, {
      method: "POST",
      headers: {
        "X-API-Key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        script: req.script,
        images: req.imageUrls.slice(0, 10),
        aspect_ratio: req.aspectRatio ?? "9:16",
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: `Pictory HTTP ${res.status}: ${t.slice(0, 200)}` };
    }
    const data = (await res.json()) as { video_url?: string; job_id?: string };
    if (!data.video_url) {
      return { ok: false, error: "Pictory response missing video_url (verify API version)" };
    }
    return { ok: true, videoUrl: data.video_url, providerJobId: data.job_id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Pictory request failed" };
  }
}
