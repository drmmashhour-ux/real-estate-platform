import type { HeyGenVideoStatus } from "@/src/modules/ai-avatar/domain/avatar.types";

const BASE = "https://api.heygen.com";

export type HeyGenCreateResult =
  | { ok: true; videoId: string }
  | { ok: false; error: string; status?: number };

/**
 * Start HeyGen Studio render (avatar + text voice). Requires uploaded/Instant Avatar in HeyGen.
 * @see https://docs.heygen.com/reference/create-an-avatar-video-v2
 */
export async function heygenCreateAvatarVideo(args: {
  apiKey: string;
  avatarId: string;
  voiceId: string;
  scriptText: string;
  title?: string;
  callbackId?: string;
}): Promise<HeyGenCreateResult> {
  const inputText = args.scriptText.trim().slice(0, 4_900);
  if (!inputText) {
    return { ok: false, error: "Empty script" };
  }

  const body = {
    title: args.title ?? "LECIPM explainer",
    caption: false,
    callback_id: args.callbackId,
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: args.avatarId,
        },
        voice: {
          type: "text",
          voice_id: args.voiceId,
          input_text: inputText,
        },
      },
    ],
  };

  const res = await fetch(`${BASE}/v2/video/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": args.apiKey,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as {
    data?: { video_id?: string };
    error?: { message?: string; code?: string } | string | null;
  } | null;

  if (!res.ok) {
    const msg =
      typeof json?.error === "object" && json.error?.message
        ? json.error.message
        : typeof json?.error === "string"
          ? json.error
          : `HeyGen HTTP ${res.status}`;
    return { ok: false, error: msg, status: res.status };
  }

  if (json?.error) {
    const msg = typeof json.error === "object" ? (json.error.message ?? "HeyGen error") : String(json.error);
    return { ok: false, error: msg, status: res.status };
  }

  const videoId = json?.data?.video_id;
  if (!videoId) {
    return { ok: false, error: "HeyGen: missing video_id in response" };
  }

  return { ok: true, videoId };
}

/**
 * Poll render status until completed/failed or timeout.
 * @see https://docs.heygen.com/reference/video-status
 */
export async function heygenGetVideoStatus(apiKey: string, videoId: string): Promise<HeyGenVideoStatus> {
  const url = new URL(`${BASE}/v1/video_status.get`);
  url.searchParams.set("video_id", videoId);

  const res = await fetch(url.toString(), {
    headers: { "x-api-key": apiKey },
  });

  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  const data = json && typeof json === "object" && "data" in json ? (json.data as Record<string, unknown>) : json;

  const status = typeof data?.status === "string" ? data.status : "unknown";
  const videoUrl = typeof data?.video_url === "string" ? data.video_url : null;
  const thumbnailUrl = typeof data?.thumbnail_url === "string" ? data.thumbnail_url : null;

  return { status, videoUrl, thumbnailUrl, raw: json };
}

export async function heygenPollUntilDone(
  apiKey: string,
  videoId: string,
  options?: { maxMs?: number; intervalMs?: number }
): Promise<HeyGenVideoStatus> {
  const maxMs = options?.maxMs ?? 45_000;
  const intervalMs = options?.intervalMs ?? 2_000;
  const deadline = Date.now() + maxMs;

  for (;;) {
    const s = await heygenGetVideoStatus(apiKey, videoId);
    if (s.status === "completed" || s.status === "failed") {
      return s;
    }
    if (Date.now() >= deadline) {
      return { ...s, status: s.status === "unknown" ? "timeout" : s.status };
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
