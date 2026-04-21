/**
 * Browser MediaRecorder helpers (no React). Use only in client components.
 */
import { MAX_VOICE_DURATION_SEC } from "@/modules/messaging/voice/voice.types";

export type RecorderStatus = "idle" | "recording" | "stopped";

export function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  if (MediaRecorder.isTypeSupported?.("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported?.("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported?.("audio/ogg;codecs=opus")) return "audio/ogg;codecs=opus";
  return "audio/webm";
}

export class VoiceRecorderSession {
  private media: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: BlobPart[] = [];
  private startedAt = 0;
  private maxTimer: ReturnType<typeof setTimeout> | null = null;
  status: RecorderStatus = "idle";

  async start(onMaxDuration?: () => void): Promise<void> {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone not supported in this browser");
    }
    this.chunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = pickMimeType();
    this.media = new MediaRecorder(this.stream, { mimeType: mime });
    this.media.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.media.start(200);
    this.startedAt = Date.now();
    this.status = "recording";
    this.maxTimer = setTimeout(() => {
      onMaxDuration?.();
      void this.stop().catch(() => {});
    }, MAX_VOICE_DURATION_SEC * 1000);
  }

  async stop(): Promise<{ blob: Blob; durationSec: number; mimeType: string }> {
    const mime = this.media?.mimeType || pickMimeType();
    return await new Promise((resolve, reject) => {
      if (!this.media) {
        reject(new Error("Not recording"));
        return;
      }
      this.media.onstop = () => {
        const end = Date.now();
        const durationSec = Math.min(
          MAX_VOICE_DURATION_SEC,
          Math.max(1, Math.round((end - this.startedAt) / 1000))
        );
        const blob = new Blob(this.chunks, { type: mime });
        this.cleanup();
        this.status = "stopped";
        resolve({ blob, durationSec, mimeType: mime });
      };
      this.media.onerror = () => {
        this.cleanup();
        reject(new Error("Recording failed"));
      };
      try {
        this.media.stop();
      } catch (e) {
        this.cleanup();
        reject(e instanceof Error ? e : new Error("Stop failed"));
      }
    });
  }

  cancel(): void {
    try {
      this.media?.stop();
    } catch {
      /* ignore */
    }
    this.cleanup();
    this.status = "idle";
  }

  private cleanup(): void {
    if (this.maxTimer) {
      clearTimeout(this.maxTimer);
      this.maxTimer = null;
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.media = null;
    this.chunks = [];
  }
}
