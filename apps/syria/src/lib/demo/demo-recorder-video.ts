/**
 * Local screen/tab capture via MediaRecorder — no upload, no cloud (blob stays in memory until download).
 * Requires user permission via getDisplayMedia (pick tab/window/screen).
 */

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

let mediaRecorder: MediaRecorder | null = null;
let streamRef: MediaStream | null = null;
let chunks: Blob[] = [];
let mimeType = "video/webm";
let lastBlobUrl: string | null = null;

/** Latest finished capture (updated whenever recording stops). */
let lastCapture: { blob: Blob; blobUrl: string } | null = null;

let pendingStopResolve: ((value: { blob: Blob; blobUrl: string } | null) => void) | null = null;

let finishRecordingEntered = false;

function pickMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "video/webm";
}

function cleanupStream(): void {
  try {
    streamRef?.getTracks().forEach((t) => t.stop());
  } catch {
    /* ignore */
  }
  streamRef = null;
}

/** Subscribe to recording state changes (start/stop). */
export function subscribeRecordingState(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function isRecording(): boolean {
  return mediaRecorder?.state === "recording";
}

export function isVideoRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getDisplayMedia)
  );
}

export function getLastVideoCapture(): { blob: Blob; blobUrl: string } | null {
  return lastCapture;
}

function revokeLastBlobUrl(): void {
  if (lastBlobUrl && typeof URL !== "undefined") {
    try {
      URL.revokeObjectURL(lastBlobUrl);
    } catch {
      /* ignore */
    }
  }
  lastBlobUrl = null;
}

function finishRecording(): void {
  if (finishRecordingEntered) {
    pendingStopResolve?.(lastCapture);
    pendingStopResolve = null;
    return;
  }
  finishRecordingEntered = true;

  const recordedMime = mimeType || "video/webm";

  try {
    revokeLastBlobUrl();
    if (chunks.length === 0) {
      lastCapture = null;
    } else {
      const blob = new Blob(chunks, { type: recordedMime.split(";")[0] ?? "video/webm" });
      const blobUrl = URL.createObjectURL(blob);
      lastBlobUrl = blobUrl;
      lastCapture = { blob, blobUrl };
    }
  } catch {
    lastCapture = null;
  }

  chunks = [];
  mediaRecorder = null;
  cleanupStream();

  pendingStopResolve?.(lastCapture);
  pendingStopResolve = null;

  notify();
  finishRecordingEntered = false;
}

/**
 * Captures the chosen display surface (tab/window/screen). User must approve the browser prompt.
 */
export async function startRecording(): Promise<void> {
  if (typeof window === "undefined") throw new Error("Recording runs in the browser only.");
  if (!isVideoRecordingSupported()) throw new Error("Screen recording is not supported in this browser.");

  if (mediaRecorder?.state === "recording") return;

  finishRecordingEntered = false;

  revokeLastBlobUrl();
  lastCapture = null;
  cleanupStream();

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 30 },
    audio: false,
  });
  streamRef = stream;

  chunks = [];
  mimeType = pickMimeType();
  mediaRecorder = new MediaRecorder(stream, { mimeType });

  mediaRecorder.ondataavailable = (ev: BlobEvent) => {
    if (ev.data.size > 0) chunks.push(ev.data);
  };

  mediaRecorder.onstop = () => {
    finishRecording();
  };

  const track = stream.getVideoTracks()[0];
  if (track) {
    track.addEventListener(
      "ended",
      () => {
        if (mediaRecorder?.state === "recording") {
          try {
            mediaRecorder.stop();
          } catch {
            /* ignore */
          }
        }
      },
      { once: true },
    );
  }

  mediaRecorder.start(250);
  notify();
}

/**
 * Stops capture, builds a Blob + object URL (caller should download or revoke).
 */
export async function stopRecording(): Promise<{ blob: Blob; blobUrl: string } | null> {
  const rec = mediaRecorder;

  if (!rec || rec.state === "inactive") {
    cleanupStream();
    mediaRecorder = null;
    notify();
    return lastCapture;
  }

  return await new Promise<{ blob: Blob; blobUrl: string } | null>((resolve) => {
    pendingStopResolve = resolve;
    try {
      rec.stop();
    } catch {
      /* InvalidStateError if already finalized — onstop should still run */
    }
  });
}

export function revokeRecordingBlobUrl(url: string | null | undefined): void {
  if (!url || typeof URL === "undefined") return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
  if (url === lastBlobUrl) lastBlobUrl = null;
}

/** Trigger a local file download — still no server upload. */
export function downloadRecording(blob: Blob, filename?: string): void {
  const name =
    filename ?? `hadiah-demo-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.webm`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60_000);
}
