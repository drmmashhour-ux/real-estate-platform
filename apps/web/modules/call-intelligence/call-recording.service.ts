import type { ManualRecordingState } from "./call-intelligence.types";

export type RecordingHandle = {
  getState: () => ManualRecordingState;
  mimeType: string;
  /** Finalizes recording and returns audio Blob (null if nothing captured). */
  stop: () => Promise<Blob | null>;
};

/** Pick best supported mime for MediaRecorder */
export function pickRecorderMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

/**
 * Starts **manual** recording after explicit user consent in the UI.
 * Pass an existing MediaStream from `getUserMedia` — this does not request permission.
 */
export function startManualRecording(mediaStream: MediaStream): RecordingHandle | { error: string } {
  if (typeof MediaRecorder === "undefined") {
    return { error: "recording_unsupported" };
  }
  const mimeType = pickRecorderMime();
  let recorder: MediaRecorder;
  try {
    recorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
  } catch {
    return { error: "recorder_init_failed" };
  }

  const chunks: BlobPart[] = [];
  let state: ManualRecordingState = "recording";

  recorder.ondataavailable = (e: BlobEvent) => {
    if (e.data?.size) chunks.push(e.data);
  };

  recorder.start(250);

  return {
    mimeType: recorder.mimeType || mimeType || "audio/webm",
    getState: () => state,
    stop: () =>
      new Promise<Blob | null>((resolve) => {
        if (state !== "recording") {
          resolve(null);
          return;
        }
        recorder.onstop = () => {
          state = "stopped";
          const blob =
            chunks.length > 0
              ? new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" })
              : null;
          resolve(blob);
        };
        try {
          if (recorder.state === "recording") {
            recorder.requestData();
          }
          recorder.stop();
        } catch {
          state = "stopped";
          resolve(null);
        }
      }),
  };
}
