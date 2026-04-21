/** Voice clip limits — aligned with ~60s compressed voice note. */
export const MAX_VOICE_DURATION_SEC = 60;
export const MAX_VOICE_BYTES = 3_500_000;

export const VOICE_ALLOWED_MIME = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
]);

export type VoiceMessagePayload = {
  type: "VOICE";
  audioUrl: string;
  durationSec?: number;
  mimeType?: string;
};

export function isVoicePayload(v: unknown): v is VoiceMessagePayload {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return o.type === "VOICE" && typeof o.audioUrl === "string" && o.audioUrl.length > 0;
}
