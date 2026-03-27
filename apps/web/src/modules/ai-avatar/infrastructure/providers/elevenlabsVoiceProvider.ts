/**
 * ElevenLabs: cloned or stock voices, high-quality TTS.
 * Use for: audio-only explainer track, or preprocess audio for video pipelines that accept audio_url.
 *
 * @see https://elevenlabs.io/docs/api-reference/text-to-speech/convert
 */

export type ElevenLabsSynthesizeResult =
  | { ok: true; audio: ArrayBuffer; contentType: string }
  | { ok: false; error: string; status?: number };

export async function elevenlabsTextToSpeech(args: {
  apiKey: string;
  voiceId: string;
  text: string;
  modelId?: string;
}): Promise<ElevenLabsSynthesizeResult> {
  const text = args.text.trim().slice(0, 10_000);
  if (!text) return { ok: false, error: "Empty text" };

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(args.voiceId)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      "xi-api-key": args.apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: args.modelId ?? "eleven_multilingual_v2",
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return {
      ok: false,
      error: errText.slice(0, 500) || `ElevenLabs HTTP ${res.status}`,
      status: res.status,
    };
  }

  const audio = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "audio/mpeg";
  return { ok: true, audio, contentType };
}
