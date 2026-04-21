"use client";

import { useEffect, useRef, useState } from "react";
import type { VoiceMessagePayload } from "@/modules/messaging/voice/voice.types";

export function VoiceMessageBubble({ payload }: { payload: VoiceMessagePayload }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(
    typeof payload.durationSec === "number" ? payload.durationSec : null
  );

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onMeta = () => setDuration(Math.round(el.duration || 0));
    el.addEventListener("loadedmetadata", onMeta);
    return () => el.removeEventListener("loadedmetadata", onMeta);
  }, [payload.audioUrl]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const end = () => setPlaying(false);
    el.addEventListener("ended", end);
    return () => el.removeEventListener("ended", end);
  }, []);

  const label =
    duration != null && duration > 0 ? `${duration}s voice note` : "Voice message";

  return (
    <div className="flex flex-col gap-2">
      <audio ref={audioRef} src={payload.audioUrl} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={() => toggle()}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-left text-sm text-emerald-50 transition hover:bg-emerald-900/50"
      >
        <span className="text-lg" aria-hidden>
          🎙️
        </span>
        <span>{playing ? "Pause" : "Play"}</span>
        <span className="text-[10px] text-emerald-200/80">{label}</span>
      </button>
      <p className="text-[10px] text-slate-500">Voice messages may be transcribed over time where enabled.</p>
    </div>
  );
}
