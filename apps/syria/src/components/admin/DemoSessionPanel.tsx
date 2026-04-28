"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useInvestorDemoRecording } from "@/components/demo/DemoRecordingProvider";
import { useAutoNarration } from "@/components/demo/NarrationProvider";

const DEMO_GUIDE_LOCALE_PATH = "/en/demo" as const;
const LS_DEMO_SESSION_KEY = "syria_investor_demo_session";

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
  const [status, setStatus] = useState<StatusJson | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const s = status;

  return (
    <div className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm [dir=rtl]:text-right">
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

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void startFullInvestorDemo()}
          className="rounded-xl border border-violet-600 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-950 hover:bg-violet-100 disabled:opacity-50"
        >
          {busy === "full" ? "Starting…" : "🚀 Start Investor Demo"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void post("/api/admin/demo-session/start", "start")}
          className="rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100 disabled:opacity-50"
        >
          {busy === "start" ? "…" : "Start session"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void post("/api/admin/demo-session/stop", "stop")}
          className="rounded-xl border border-stone-400 bg-stone-100 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-200 disabled:opacity-50"
        >
          {busy === "stop" ? "…" : "Stop session"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void post("/api/admin/demo-session/reset", "reset")}
          className="rounded-xl border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
        >
          {busy === "reset" ? "…" : "Reset demo data"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy) || demoRec?.recording || !demoRec?.demoUxActive}
          onClick={() => void recordDemoClick()}
          className="rounded-xl border border-violet-500 bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          🎥 Record Demo
        </button>
        <button
          type="button"
          disabled={Boolean(busy) || demoRec?.replaying || !demoRec?.demoUxActive}
          onClick={() => void replayDemoClick()}
          className="rounded-xl border border-sky-500 bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
        >
          ▶ Replay Demo
        </button>
        {demoRec?.recording ? (
          <button
            type="button"
            disabled={Boolean(busy)}
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
            disabled={Boolean(busy)}
            onClick={() => demoRec.abortReplay()}
            className="rounded-xl border border-red-400 bg-red-50 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100 disabled:opacity-50"
          >
            Abort replay
          </button>
        ) : null}
        {narration?.envEnabled && narration.investorDemoActive ? (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => narration.setUserNarrationEnabled(!narration.userNarrationEnabled)}
            className="rounded-xl border border-indigo-500 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-950 hover:bg-indigo-100 disabled:opacity-50"
          >
            {narration.userNarrationEnabled ? "🔊 Narration ON" : "🔊 Narration OFF"}
          </button>
        ) : null}
      </div>

      {success ? <p className="mt-3 text-xs font-medium text-emerald-800">{success}</p> : null}
      {error ? <p className="mt-3 text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
