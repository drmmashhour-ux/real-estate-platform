"use client";

import { useEffect, useState } from "react";
import { isRecording, subscribeRecordingState } from "@/lib/demo/demo-recorder-video";

/** Floating badge while browser screen capture is active (persists away from admin panel). */
export function DemoVideoRecordingBadge() {
  const [, setBump] = useState(0);

  useEffect(() => subscribeRecordingState(() => setBump((n) => n + 1)), []);

  if (!isRecording()) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-4 start-4 z-[59] rounded-xl border border-red-500/70 bg-red-950/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md"
    >
      🔴 Recording…
    </div>
  );
}
