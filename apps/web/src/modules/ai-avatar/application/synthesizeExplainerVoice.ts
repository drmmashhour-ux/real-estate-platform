import { getElevenLabsConfig } from "@/src/modules/ai-avatar/infrastructure/providers/productionAvatarEnv";
import { elevenlabsTextToSpeech } from "@/src/modules/ai-avatar/infrastructure/providers/elevenlabsVoiceProvider";

export type ExplainerVoiceResult =
  | { ok: true; audio: ArrayBuffer; contentType: string }
  | { ok: false; error: string };

/**
 * ElevenLabs voice clone / stock — for audio-only explainers or pairing with video tools that accept uploaded audio.
 * Never send API keys to the browser; call from server routes or actions only.
 */
export async function synthesizeExplainerVoice(text: string): Promise<ExplainerVoiceResult> {
  const cfg = getElevenLabsConfig();
  if (!cfg.apiKey || !cfg.voiceId) {
    return {
      ok: false,
      error: "Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID (clone or preset from ElevenLabs dashboard).",
    };
  }

  const out = await elevenlabsTextToSpeech({
    apiKey: cfg.apiKey,
    voiceId: cfg.voiceId,
    text,
    modelId: cfg.modelId,
  });

  if (!out.ok) {
    return { ok: false, error: out.error };
  }
  return { ok: true, audio: out.audio, contentType: out.contentType };
}
