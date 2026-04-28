"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { demoScript } from "@/lib/demo/demo-script";
import { isAbortError, runDemoScript } from "@/lib/demo/demo-player";
import {
  cancelActiveNarrationPlayback,
  registerAiVoiceUserPreference,
} from "@/lib/demo/narrator";
import {
  downloadRecording,
  getLastVideoCapture,
  isRecording,
  isVideoRecordingSupported,
  startRecording,
  stopRecording,
  subscribeRecordingState,
} from "@/lib/demo/demo-recorder-video";
import { useInvestorDemoRecording } from "@/components/demo/DemoRecordingProvider";
import { useAutoNarration } from "@/components/demo/NarrationProvider";
import { useStoryMode } from "@/components/demo/StoryModeProvider";

const DEMO_GUIDE_LOCALE_PATH = "/en/demo" as const;
const LS_DEMO_SESSION_KEY = "syria_investor_demo_session";
const LS_AI_VOICE_USER = "syria_ai_voice_user_enabled";
const LS_AUTO_VIDEO_STORY = "syria_demo_auto_video_with_story";

type StatusJson = {
  ok?: boolean;
  demoEffective?: boolean;
  sessionActive?: boolean;
  expiresAtIso?: string | null;
  sessionId?: string | null;
  autoClean?: boolean;
  remainingMinutes?: number | null;
};

export function DemoSessionPanel() {
  const router = useRouter();
  const demoRec = useInvestorDemoRecording();
  const narration = useAutoNarration();
  const storyMode = useStoryMode();
  const [status, setStatus] = useState<StatusJson | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoDemoRunning, setAutoDemoRunning] = useState(false);
  const autoDemoAbortRef = useRef<AbortController | null>(null);
  const [aiVoiceUserEnabled, setAiVoiceUserEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem(LS_AI_VOICE_USER) !== "0";
    } catch {
      return true;
    }
  });

  const [, setVideoUiBump] = useState(0);
  useEffect(() => subscribeRecordingState(() => setVideoUiBump((n) => n + 1)), []);

  const [autoVideoWithStory, setAutoVideoWithStory] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(LS_AUTO_VIDEO_STORY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_AUTO_VIDEO_STORY, autoVideoWithStory ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [autoVideoWithStory]);

  const screenVideoActive = isRecording();
  const lastScreenCapture = getLastVideoCapture();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/demo-session/status", { credentials: "same-origin" });
      const data = (await res.json()) as StatusJson;
      setStatus(res.ok ? data : null);
      if (!res.ok) setError("Unable to load demo session status");
    } catch {
      setError("Unable to load demo session status");
    }
  }, []);

  useEffect(() => {
    registerAiVoiceUserPreference(aiVoiceUserEnabled);
    try {
      localStorage.setItem(LS_AI_VOICE_USER, aiVoiceUserEnabled ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [aiVoiceUserEnabled]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial status fetch + interval poll
    void refresh();
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  async function post(url: string, label: string) {
    setBusy(label);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(url, { method: "POST", credentials: "same-origin" });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.message ?? `HTTP ${res.status}`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  async function startFullInvestorDemo() {
    setBusy("full");
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/demo-session/start-full", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        sessionId?: string;
        expiresAt?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.message ?? `HTTP ${res.status}`);
      }
      try {
        localStorage.setItem(
          LS_DEMO_SESSION_KEY,
          JSON.stringify({
            sessionId: data.sessionId ?? "",
            expiresAt: data.expiresAt ?? "",
            startedAt: new Date().toISOString(),
          }),
        );
      } catch {
        /* ignore quota / private mode */
      }
      setSuccess("Investor demo started — opening guided flow…");
      await refresh();
      window.setTimeout(() => {
        router.push(DEMO_GUIDE_LOCALE_PATH as never);
      }, 400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  async function recordDemoClick() {
    if (!demoRec?.demoUxActive) {
      setError("Investor demo mode must be enabled (INVESTOR_DEMO_MODE).");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await demoRec.beginRecording();
      setSuccess("Recording demo interactions — tagged clicks and navigation are captured.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start recording");
    }
  }

  async function replayDemoClick() {
    if (!demoRec?.demoUxActive) {
      setError("Investor demo mode must be enabled (INVESTOR_DEMO_MODE).");
      return;
    }
    setError(null);
    setSuccess(null);
    const ok = await demoRec.runReplay();
    if (!ok) {
      setError(
        "Replay did not finish — record a demo first, ensure events exist, or you cancelled mid-replay.",
      );
    } else {
      setSuccess("Replay finished (navigation + highlights only — no writes).");
    }
  }

  /** Narration comes from layout; session GET provides authoritative demoEffective when loaded. */
  const demoReadyForAutoTour =
    Boolean(narration?.investorDemoActive) && status?.demoEffective !== false;

  async function startAutoDemo() {
    if (!demoReadyForAutoTour || autoDemoRunning || Boolean(storyMode?.running)) {
      if (!demoReadyForAutoTour) {
        setError("Effective investor demo must be ON before Auto Demo (runtime / env).");
      }
      return;
    }
    setError(null);
    setSuccess(null);
    autoDemoAbortRef.current = new AbortController();
    setAutoDemoRunning(true);
    try {
      await runDemoScript({
        steps: demoScript,
        navigate: (path) => {
          router.push(path);
        },
        signal: autoDemoAbortRef.current.signal,
      });
      setSuccess("Auto demo finished.");
    } catch (e) {
      if (isAbortError(e)) {
        setSuccess("Auto demo stopped.");
      } else {
        setError(e instanceof Error ? e.message : "Auto demo failed");
      }
    } finally {
      setAutoDemoRunning(false);
      autoDemoAbortRef.current = null;
    }
  }

  function stopAutoDemo() {
    autoDemoAbortRef.current?.abort();
    cancelActiveNarrationPlayback();
  }

  async function startStoryModeUi() {
    if (!storyMode || !demoReadyForAutoTour || storyMode.running || autoDemoRunning) {
      if (!demoReadyForAutoTour) {
        setError("Effective investor demo must be ON before Story Mode (runtime / env).");
      }
      return;
    }
    setError(null);
    setSuccess(null);

    let startedVideo = false;
    let captureFailed = false;
    if (autoVideoWithStory && isVideoRecordingSupported()) {
      try {
        await startRecording();
        startedVideo = true;
      } catch {
        captureFailed = true;
      }
    }

    const outcome = await storyMode.startStoryMode();

    if (startedVideo && isRecording()) {
      try {
        await stopRecording();
      } catch {
        /* ignore */
      }
    }

    const clip = getLastVideoCapture();
    if (startedVideo && clip?.blob.size) {
      setSuccess(
        outcome === "completed"
          ? "Story Mode finished — screen recording ready. Use Download Video (local WebM)."
          : "Story Mode stopped — screen recording ready. Use Download Video (local WebM).",
      );
    } else if (captureFailed) {
      setSuccess(
        outcome === "completed"
          ? "Story Mode finished — screen capture was cancelled or blocked."
          : "Story Mode stopped — screen capture was cancelled or blocked.",
      );
    } else {
      if (outcome === "completed") {
        setSuccess("Story Mode finished.");
      } else {
        setSuccess("Story Mode stopped.");
      }
    }
  }

  async function startScreenVideoClick() {
    if (!narration?.investorDemoActive) {
      setError("Investor demo mode must be enabled (INVESTOR_DEMO_MODE).");
      return;
    }
    setError(null);
    try {
      await startRecording();
      setSuccess(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start screen capture");
    }
  }

  async function stopScreenVideoClick() {
    setError(null);
    try {
      await stopRecording();
      setSuccess("Screen recording stopped — download when ready (stays on this device).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not stop recording");
    }
  }

  function downloadScreenVideoClick() {
    const cap = getLastVideoCapture();
    if (!cap?.blob.size) return;
    downloadRecording(cap.blob);
  }

  function stopStoryModeUi() {
    storyMode?.stopStoryMode();
  }

  const s = status;

  return (
    <div className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm [dir=rtl]:text-right">
      {autoDemoRunning ? (
        <div
          role="status"
          className="mb-4 rounded-xl border border-violet-500 bg-violet-50 px-3 py-2 text-center text-sm font-semibold text-violet-950"
        >
          🎬 Auto Demo Running…
        </div>
      ) : null}
      {storyMode?.running ? (
        <div
          role="status"
          className="mb-4 rounded-xl border border-sky-600 bg-sky-50 px-3 py-2 text-center text-sm font-semibold text-sky-950"
        >
          🎬 Story Mode — Investor Presentation
        </div>
      ) : null}
      {screenVideoActive ? (
        <div
          role="status"
          className="mb-4 rounded-xl border border-red-600 bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-950"
        >
          🔴 Recording… Screen capture active — WebM stays in your browser until you download.
        </div>
      ) : null}
      <h2 className="text-base font-semibold text-stone-900">Demo session</h2>
      <p className="mt-2 text-xs text-red-900/90">
        Demo mode blocks real payments — no Stripe charges; bookings use seeded DEMO_* rows only.
      </p>
      <p className="mt-1 text-xs text-amber-900/85">
        When auto-clean is on, stopping or expiring the session triggers investor-demo reset (demo markers only).
      </p>

      <dl className="mt-4 space-y-2 text-sm text-stone-700">
        <div className="flex flex-wrap gap-2">
          <dt className="font-medium text-stone-600">Effective demo UX</dt>
          <dd>{s?.demoEffective ? "ON" : "OFF"}</dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="font-medium text-stone-600">Session</dt>
          <dd>{s?.sessionActive ? "ACTIVE" : "inactive"}</dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="font-medium text-stone-600">Session ID</dt>
          <dd className="font-mono text-xs break-all">{s?.sessionId ?? "—"}</dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="font-medium text-stone-600">Expires</dt>
          <dd>{s?.expiresAtIso ?? "—"}</dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="font-medium text-stone-600">Approx. remaining</dt>
          <dd>{s?.remainingMinutes != null ? `${s.remainingMinutes} min` : "—"}</dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="font-medium text-stone-600">Auto-clean</dt>
          <dd>{s?.autoClean ? "yes" : "no"}</dd>
        </div>
      </dl>

      <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs text-stone-700 [dir=rtl]:text-right">
        <input
          type="checkbox"
          className="mt-0.5 rounded border-stone-400"
          checked={autoVideoWithStory}
          onChange={(e) => setAutoVideoWithStory(e.target.checked)}
        />
        <span>
          Auto-record screen video when Story Mode starts (same button click — choose the tab or window to capture).
        </span>
      </label>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={
            Boolean(busy) ||
            autoDemoRunning ||
            Boolean(storyMode?.running) ||
            !demoReadyForAutoTour ||
            !storyMode
          }
          onClick={() => void startStoryModeUi()}
          className="rounded-xl border border-sky-700 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-950 hover:bg-sky-100 disabled:opacity-50"
        >
          🎬 Start Story Mode
        </button>
        <button
          type="button"
          disabled={!storyMode?.running}
          onClick={() => storyMode?.togglePause()}
          className="rounded-xl border border-sky-600 bg-white px-4 py-2 text-sm font-semibold text-sky-950 hover:bg-sky-50 disabled:opacity-50"
        >
          {storyMode?.paused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <button
          type="button"
          disabled={!storyMode?.running}
          onClick={() => storyMode?.skipScene()}
          className="rounded-xl border border-sky-600 bg-white px-4 py-2 text-sm font-semibold text-sky-950 hover:bg-sky-50 disabled:opacity-50"
        >
          ⏭ Skip
        </button>
        <button
          type="button"
          disabled={!storyMode?.running}
          onClick={() => stopStoryModeUi()}
          className="rounded-xl border border-stone-500 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-200 disabled:opacity-50"
        >
          ⏹ Stop
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50/95 p-4 [dir=rtl]:text-right">
        <p className="text-xs font-semibold text-stone-900">Screen video (MediaRecorder — local file only)</p>
        <p className="mt-1 text-[11px] text-stone-600">
          Pick this browser tab or your screen when prompted. Nothing is uploaded — WebM downloads to your machine.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={
              Boolean(busy) ||
              autoDemoRunning ||
              Boolean(storyMode?.running) ||
              !narration?.investorDemoActive ||
              screenVideoActive ||
              Boolean(demoRec?.recording) ||
              !isVideoRecordingSupported()
            }
            onClick={() => void startScreenVideoClick()}
            className="rounded-xl border border-red-700 bg-red-50 px-4 py-2 text-sm font-semibold text-red-950 hover:bg-red-100 disabled:opacity-50"
          >
            🔴 Record Demo
          </button>
          <button
            type="button"
            disabled={!screenVideoActive}
            onClick={() => void stopScreenVideoClick()}
            className="rounded-xl border border-stone-500 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-200 disabled:opacity-50"
          >
            ⏹ Stop Recording
          </button>
          <button
            type="button"
            disabled={!lastScreenCapture?.blob.size}
            onClick={() => downloadScreenVideoClick()}
            className="rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-100 disabled:opacity-50"
          >
            ⬇ Download Video
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy) || autoDemoRunning || Boolean(storyMode?.running) || !demoReadyForAutoTour}
          onClick={() => void startAutoDemo()}
          className="rounded-xl border border-fuchsia-600 bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-950 hover:bg-fuchsia-100 disabled:opacity-50"
        >
          ▶ Auto Demo
        </button>
        <button
          type="button"
          disabled={!autoDemoRunning}
          onClick={() => stopAutoDemo()}
          className="rounded-xl border border-stone-500 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-200 disabled:opacity-50"
        >
          ⏹ Stop Demo
        </button>
        <button
          type="button"
          disabled={Boolean(busy) || autoDemoRunning}
          onClick={() => void startFullInvestorDemo()}
          className="rounded-xl border border-violet-600 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-950 hover:bg-violet-100 disabled:opacity-50"
        >
          {busy === "full" ? "Starting…" : "🚀 Start Investor Demo"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy) || autoDemoRunning}
          onClick={() => void post("/api/admin/demo-session/start", "start")}
          className="rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100 disabled:opacity-50"
        >
          {busy === "start" ? "…" : "Start session"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy) || autoDemoRunning}
          onClick={() => void post("/api/admin/demo-session/stop", "stop")}
          className="rounded-xl border border-stone-400 bg-stone-100 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-200 disabled:opacity-50"
        >
          {busy === "stop" ? "…" : "Stop session"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy) || autoDemoRunning}
          onClick={() => void post("/api/admin/demo-session/reset", "reset")}
          className="rounded-xl border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
        >
          {busy === "reset" ? "…" : "Reset demo data"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy) || autoDemoRunning || demoRec?.recording || !demoRec?.demoUxActive}
          onClick={() => void recordDemoClick()}
          className="rounded-xl border border-violet-500 bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          🎥 Record Demo
        </button>
        <button
          type="button"
          disabled={Boolean(busy) || autoDemoRunning || demoRec?.replaying || !demoRec?.demoUxActive}
          onClick={() => void replayDemoClick()}
          className="rounded-xl border border-sky-500 bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
        >
          ▶ Replay Demo
        </button>
        {demoRec?.recording ? (
          <button
            type="button"
            disabled={Boolean(busy) || autoDemoRunning}
            onClick={() => {
              demoRec.stopRecording();
              setSuccess("Recording stopped — events kept locally until next Record.");
            }}
            className="rounded-xl border border-stone-500 bg-stone-200 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-300 disabled:opacity-50"
          >
            Stop recording
          </button>
        ) : null}
        {demoRec?.replaying ? (
          <button
            type="button"
            disabled={Boolean(busy) || autoDemoRunning}
            onClick={() => demoRec.abortReplay()}
            className="rounded-xl border border-red-400 bg-red-50 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100 disabled:opacity-50"
          >
            Abort replay
          </button>
        ) : null}
        {narration?.envEnabled && narration.investorDemoActive ? (
          <button
            type="button"
            disabled={Boolean(busy) || autoDemoRunning}
            onClick={() => narration.setUserNarrationEnabled(!narration.userNarrationEnabled)}
            className="rounded-xl border border-indigo-500 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-950 hover:bg-indigo-100 disabled:opacity-50"
          >
            {narration.userNarrationEnabled ? "🔊 Narration ON" : "🔊 Narration OFF"}
          </button>
        ) : null}
        {narration?.investorDemoActive ? (
          <button
            type="button"
            disabled={
              Boolean(busy) ||
              autoDemoRunning ||
              !narration.aiNarrationEnvEnabled
            }
            onClick={() => setAiVoiceUserEnabled((v) => !v)}
            title={
              narration.aiNarrationEnvEnabled
                ? "Prefer AI voice when enabled server-side; falls back to browser speech otherwise."
                : "Enable AI_NARRATION_ENABLED on the server to use AI voice."
            }
            className="rounded-xl border border-fuchsia-600 bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-950 hover:bg-fuchsia-100 disabled:opacity-50"
          >
            {aiVoiceUserEnabled ? "🎙 AI Voice ON" : "🎙 AI Voice OFF"}
          </button>
        ) : null}
      </div>

      {success ? <p className="mt-3 text-xs font-medium text-emerald-800">{success}</p> : null}
      {error ? <p className="mt-3 text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
