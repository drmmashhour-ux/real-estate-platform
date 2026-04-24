/**
 * Lightweight, non-ML heuristics from message metadata. Does not process raw audio.
 */
export type VoiceMessageAudioMetadata = {
  /** Wall-clock duration in seconds (from recorder or container) */
  durationSec: number;
  /**
   * Messages in this thread in roughly the last hour, used as a coarse "cadence" signal.
   * If omitted, cadence is treated as unknown.
   */
  recentThreadMessageCount1h?: number;
};

export type VoiceAnalysis = {
  speakingSpeed?: number;
  confidence?: "low" | "medium" | "high";
  urgency?: "low" | "medium" | "high";
};

/** Words per minute: assumed ~3 chars/word for rough estimate from duration only (no transcript). */
export function estimateWordsPerMinuteFromBytesEstimate(durationSec: number, assumedCharsPerSec = 12): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0;
  const words = (assumedCharsPerSec * durationSec) / 5.5;
  return words / (durationSec / 60);
}

export function analyzeVoiceMessage(audioMetadata: VoiceMessageAudioMetadata): VoiceAnalysis {
  try {
    const d = audioMetadata.durationSec;
    if (!Number.isFinite(d) || d <= 0) {
      return { confidence: "low", urgency: "low" };
    }

    const wpm = estimateWordsPerMinuteFromBytesEstimate(d);
    const speed = Math.round((wpm / 20) * 20);

    const cadence = audioMetadata.recentThreadMessageCount1h ?? 0;
    const urgency: VoiceAnalysis["urgency"] = d < 8 && cadence > 2 ? "high" : d > 45 ? "low" : "medium";

    const confidence: VoiceAnalysis["confidence"] =
      d < 1 || d > 120 || !Number.isFinite(wpm) ? "low" : wpm < 100 || wpm > 200 ? "medium" : "high";

    return {
      speakingSpeed: speed,
      confidence,
      urgency,
    };
  } catch {
    return { confidence: "low", urgency: "low" };
  }
}
