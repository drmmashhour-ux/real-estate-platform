/**
 * Production avatar stack (server-only). Keys never exposed to the client.
 *
 * Video face: HeyGen or D-ID (text → talking video, upload/record face in vendor UI).
 * Voice clone: ElevenLabs (use cloned voice_id here, or map clone into HeyGen’s voice list).
 */

export type LecipmAvatarVideoProvider = "none" | "heygen" | "did";

export function getLecipmAvatarVideoProvider(): LecipmAvatarVideoProvider {
  const v = (process.env.LECIPM_AVATAR_VIDEO_PROVIDER ?? "none").toLowerCase();
  if (v === "heygen") return "heygen";
  if (v === "did" || v === "d-id") return "did";
  return "none";
}

export function getHeyGenConfig() {
  return {
    apiKey: process.env.HEYGEN_API_KEY?.trim() ?? "",
    avatarId: process.env.HEYGEN_AVATAR_ID?.trim() ?? "",
    voiceId: process.env.HEYGEN_VOICE_ID?.trim() ?? "",
  };
}

export function getDidConfig() {
  return {
    apiKey: process.env.DID_API_KEY?.trim() ?? "",
    /** HTTPS URL of face image (D-ID talks). */
    sourceImageUrl: process.env.DID_SOURCE_IMAGE_URL?.trim() ?? "",
    /** Built-in TTS provider inside D-ID (e.g. microsoft). For ElevenLabs timbre, prefer HeyGen + ElevenLabs-linked voice or audio pipeline below. */
    scriptProviderType: (process.env.DID_SCRIPT_TTS_TYPE ?? "microsoft").trim(),
    scriptVoiceId: (process.env.DID_SCRIPT_VOICE_ID ?? "en-US-JennyNeural").trim(),
  };
}

export function getElevenLabsConfig() {
  return {
    apiKey: process.env.ELEVENLABS_API_KEY?.trim() ?? "",
    voiceId: process.env.ELEVENLABS_VOICE_ID?.trim() ?? "",
    modelId: process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_multilingual_v2",
  };
}

export function shouldSyncPollVideo(): boolean {
  return process.env.LECIPM_AVATAR_VIDEO_SYNC_POLL === "1" || process.env.LECIPM_AVATAR_VIDEO_SYNC_POLL === "true";
}

export function syncPollMaxMs(): number {
  const n = Number(process.env.LECIPM_AVATAR_VIDEO_SYNC_POLL_MS ?? "45000");
  return Number.isFinite(n) ? Math.min(120_000, Math.max(5_000, n)) : 45_000;
}
