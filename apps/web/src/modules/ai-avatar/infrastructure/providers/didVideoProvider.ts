import type { DidTalkStatus } from "@/src/modules/ai-avatar/domain/avatar.types";

const BASE = "https://api.d-id.com";

function basicAuthHeader(apiKey: string): string {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

export type DidCreateTalkResult =
  | { ok: true; talkId: string }
  | { ok: false; error: string; status?: number };

/**
 * Create a talking-head clip from a face image URL + script.
 * @see https://docs.d-id.com/reference/createtalk
 */
export async function didCreateTalk(args: {
  apiKey: string;
  sourceImageUrl: string;
  scriptText: string;
  ttsProviderType?: string;
  ttsVoiceId?: string;
}): Promise<DidCreateTalkResult> {
  const input = args.scriptText.trim().slice(0, 8_000);
  if (!input) return { ok: false, error: "Empty script" };
  if (!args.sourceImageUrl.startsWith("https://")) {
    return { ok: false, error: "D-ID requires DID_SOURCE_IMAGE_URL (HTTPS)" };
  }

  const res = await fetch(`${BASE}/talks`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(args.apiKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_url: args.sourceImageUrl,
      script: {
        type: "text",
        input,
        provider: {
          type: args.ttsProviderType ?? "microsoft",
          voice_id: args.ttsVoiceId ?? "en-US-JennyNeural",
        },
      },
    }),
  });

  const json = (await res.json().catch(() => null)) as { id?: string; description?: string } | null;
  if (!res.ok) {
    return {
      ok: false,
      error: json?.description ?? `D-ID HTTP ${res.status}`,
      status: res.status,
    };
  }
  const talkId = json?.id;
  if (!talkId) return { ok: false, error: "D-ID: missing talk id" };
  return { ok: true, talkId };
}

export async function didGetTalk(apiKey: string, talkId: string): Promise<DidTalkStatus> {
  const res = await fetch(`${BASE}/talks/${encodeURIComponent(talkId)}`, {
    headers: { Authorization: basicAuthHeader(apiKey) },
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  const status = typeof json?.status === "string" ? json.status : "unknown";
  const resultUrl = typeof json?.result_url === "string" ? json.result_url : null;
  return { status, resultUrl, raw: json };
}

export async function didPollUntilDone(
  apiKey: string,
  talkId: string,
  options?: { maxMs?: number; intervalMs?: number }
): Promise<DidTalkStatus> {
  const maxMs = options?.maxMs ?? 45_000;
  const intervalMs = options?.intervalMs ?? 2_000;
  const deadline = Date.now() + maxMs;

  for (;;) {
    const s = await didGetTalk(apiKey, talkId);
    if (s.status === "done" || s.status === "error" || s.status === "rejected") {
      return s;
    }
    if (Date.now() >= deadline) {
      return { ...s, status: "timeout" };
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
