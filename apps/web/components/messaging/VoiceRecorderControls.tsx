"use client";

import { useCallback, useRef, useState } from "react";
import { VoiceRecorderSession } from "@/modules/messaging/voice/audio-recorder";

type Props = {
  disabled?: boolean;
  onSendVoice: (blob: Blob, durationSec: number, mimeType: string) => Promise<void>;
};

export function VoiceRecorderControls({ disabled, onSendVoice }: Props) {
  const sessionRef = useRef<VoiceRecorderSession | null>(null);
  const stopRecordingRef = useRef<(() => Promise<void>) | null>(null);
  const [mode, setMode] = useState<"idle" | "recording" | "preview">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState("");
  const [durationSec, setDurationSec] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const resetPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBlob(null);
    setMimeType("");
    setDurationSec(0);
  }, [previewUrl]);

  const stopRecording = useCallback(async () => {
    const s = sessionRef.current;
    sessionRef.current = null;
    if (!s || s.status !== "recording") return;
    try {
      const result = await s.stop();
      const url = URL.createObjectURL(result.blob);
      setBlob(result.blob);
      setMimeType(result.mimeType);
      setDurationSec(result.durationSec);
      setPreviewUrl(url);
      setMode("preview");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Recording failed");
      setMode("idle");
    }
  }, []);

  stopRecordingRef.current = stopRecording;

  const start = useCallback(async () => {
    setErr(null);
    resetPreview();
    const s = new VoiceRecorderSession();
    sessionRef.current = s;
    try {
      await s.start(() => {
        void stopRecordingRef.current?.();
      });
      setMode("recording");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not access microphone");
      sessionRef.current = null;
    }
  }, [resetPreview]);

  const cancel = useCallback(() => {
    sessionRef.current?.cancel();
    sessionRef.current = null;
    resetPreview();
    setMode("idle");
  }, [resetPreview]);

  const send = useCallback(async () => {
    if (!blob || !mimeType) return;
    setBusy(true);
    setErr(null);
    try {
      await onSendVoice(blob, durationSec, mimeType);
      cancel();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }, [blob, mimeType, durationSec, onSendVoice, cancel]);

  return (
    <div className="border-t border-white/5 pt-2">
      {err ? <p className="mb-2 text-xs text-rose-400">{err}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        {mode === "idle" ? (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => void start()}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-900/50 disabled:opacity-40"
            title="Record voice message (max 60s)"
          >
            <span aria-hidden>🎙️</span>
            Voice
          </button>
        ) : null}
        {mode === "recording" ? (
          <>
            <span className="inline-flex items-center gap-1 text-xs text-rose-300">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" />
              Recording…
            </span>
            <button
              type="button"
              onClick={() => void stopRecording()}
              className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
            >
              Stop
            </button>
            <button type="button" onClick={() => cancel()} className="text-xs text-slate-400 hover:text-slate-200">
              Cancel
            </button>
          </>
        ) : null}
        {mode === "preview" && previewUrl ? (
          <>
            <audio controls src={previewUrl} className="h-8 max-w-[220px]" />
            <button
              type="button"
              disabled={busy}
              onClick={() => void send()}
              className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Sending…" : "Send voice"}
            </button>
            <button type="button" onClick={() => cancel()} className="text-xs text-slate-400 hover:text-slate-200">
              Discard
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
