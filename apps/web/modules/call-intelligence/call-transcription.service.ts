import type {
  SpeakerLabel,
  TranscriptChunk,
  TranscriptionCallbacks,
  TranscriptionSession,
} from "./call-intelligence.types";

/**
 * Live transcription for browser sessions.
 *
 * **Important:** The Web Speech API does not accept an arbitrary `MediaStream`; it captures the
 * user-selected/default microphone. We still require a live `MediaStream` so callers gate permission
 * and share the same mic with {@link startManualRecording} — both should use tracks from one
 * `getUserMedia` session. For server-side ASR from raw audio chunks, add a backend route later.
 */
export async function transcribeStream(
  audioStream: MediaStream,
  callbacks: TranscriptionCallbacks,
  options?: { language?: string; defaultSpeaker?: SpeakerLabel; getSpeaker?: () => SpeakerLabel },
): Promise<TranscriptionSession> {
  const audioTracks = audioStream.getAudioTracks();
  if (audioTracks.length === 0) {
    callbacks.onError?.("no_audio_track");
    return { stop: () => {} };
  }

  const SR =
    typeof globalThis !== "undefined"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- browser variants
        ((globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition)
      : undefined;

  if (typeof SR !== "function") {
    callbacks.onError?.("speech_recognition_unsupported");
    return { stop: () => {} };
  }

  const lang = options?.language ?? "en-US";
  const defaultSpeaker = options?.defaultSpeaker ?? "unknown";

  // eslint-disable-next-line new-cap -- browser constructor
  const recognition = new SR() as SpeechRecognitionCompat;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;

  recognition.onresult = (event: SpeechRecognitionResultEvent) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result?.[0]?.transcript?.trim();
      if (!text) continue;
      const speaker = getSpeaker?.() ?? defaultSpeaker;
      const chunk: TranscriptChunk = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${i}`,
        atMs: Date.now(),
        text,
        speaker,
        final: result.isFinal,
      };
      if (result.isFinal) callbacks.onFinal?.(chunk);
      else callbacks.onPartial?.(chunk);
    }
  };

  recognition.onerror = (ev: { error?: string }) => {
    callbacks.onError?.(ev.error ?? "recognition_error");
  };

  try {
    recognition.start();
  } catch (e) {
    callbacks.onError?.(e instanceof Error ? e.message : "recognition_start_failed");
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
  };
}

/** Optional: capture tab/system audio (user must approve; may be silent in some browsers). */
export async function captureSystemAudioStream(): Promise<MediaStream | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) return null;
  try {
    // Some engines require a video track for getDisplayMedia; user can share a tab and disable video in UI.
    return await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
  } catch {
    return null;
  }
}

export function mergeTranscriptChunks(chunks: TranscriptChunk[]): string {
  const finals = chunks.filter((c) => c.final && c.text.trim());
  return finals.map((c) => (c.speaker !== "unknown" ? `[${c.speaker}] ${c.text}` : c.text)).join("\n");
}

interface SpeechRecognitionCompat {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((ev: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
}

interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean } };
}
