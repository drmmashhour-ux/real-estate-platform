"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  clearDemoEventsLocal,
  DEMO_RECORDING_ACTIVE_KEY,
  DEMO_REPLAY_ACTIVE_KEY,
  loadDemoEventsLocal,
  recordDemoEvent,
  type DemoRecordedEvent,
} from "@/lib/demo/demo-recorder";
import { replayDemoSession } from "@/lib/demo/demo-replay";

const LS_SESSION_KEY = "syria_investor_demo_session";

export type InvestorDemoRecordingContextValue = {
  demoUxActive: boolean;
  recording: boolean;
  replaying: boolean;
  pulseHint: string | null;
  beginRecording: () => Promise<void>;
  stopRecording: () => void;
  /** Returns false when there is nothing to replay. */
  runReplay: () => Promise<boolean>;
  abortReplay: () => void;
};

const InvestorDemoRecordingContext = createContext<InvestorDemoRecordingContextValue | null>(null);

export function useInvestorDemoRecording(): InvestorDemoRecordingContextValue | null {
  return useContext(InvestorDemoRecordingContext);
}

function getInvestorDemoSessionIdClient(): string {
  if (typeof window === "undefined") return "default";
  try {
    const raw = localStorage.getItem(LS_SESSION_KEY);
    if (!raw) return "default";
    const j = JSON.parse(raw) as { sessionId?: string };
    return typeof j.sessionId === "string" && j.sessionId.trim() ? j.sessionId.trim().slice(0, 128) : "default";
  } catch {
    return "default";
  }
}

async function mirrorEventToServer(ev: DemoRecordedEvent): Promise<void> {
  try {
    await fetch("/api/admin/demo-record/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ sessionId: getInvestorDemoSessionIdClient(), event: ev }),
    });
  } catch {
    /* offline ok — tape stays local */
  }
}

export function DemoRecordingProvider({
  demoUxActive,
  children,
}: {
  demoUxActive: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [recording, setRecording] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [pulseHint, setPulseHint] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastNavPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setRecording(sessionStorage.getItem(DEMO_RECORDING_ACTIVE_KEY) === "1");
  }, []);

  useEffect(() => {
    if (demoUxActive || typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(DEMO_RECORDING_ACTIVE_KEY);
      sessionStorage.removeItem(DEMO_REPLAY_ACTIVE_KEY);
    } catch {
      /* ignore */
    }
    setRecording(false);
    setReplaying(false);
  }, [demoUxActive]);

  useEffect(() => {
    if (!demoUxActive || !recording) return;
    if (!pathname) return;
    if (lastNavPath.current === pathname) return;
    lastNavPath.current = pathname;
    const ev: DemoRecordedEvent = {
      type: "NAVIGATION",
      path: pathname,
      timestamp: Date.now(),
      metadata: { source: "pathname" },
    };
    recordDemoEvent(ev);
    void mirrorEventToServer(ev);
  }, [pathname, recording, demoUxActive]);

  useEffect(() => {
    if (!demoUxActive || !recording) return;

    function onPointerDown(ev: PointerEvent) {
      const target = ev.target;
      if (!(target instanceof Element)) return;
      const demoKind = target.closest("[data-demo-record]")?.getAttribute("data-demo-record");
      const link = target.closest("a[href]");
      const btn = target.closest("button");
      if (!demoKind && !link && !btn) return;

      const meta: Record<string, unknown> = {};
      if (demoKind) meta.demoKind = demoKind;
      if (link) meta.href = link.getAttribute("href")?.slice(0, 240) ?? "";
      if (btn) {
        meta.button = (btn.getAttribute("aria-label") ?? btn.textContent ?? "").trim().slice(0, 80);
      }

      const rec: DemoRecordedEvent = {
        type: "CLICK",
        path: pathname ?? "/",
        timestamp: Date.now(),
        metadata: meta,
      };
      recordDemoEvent(rec);
      void mirrorEventToServer(rec);
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [recording, demoUxActive, pathname]);

  const beginRecording = useCallback(async () => {
    if (!demoUxActive) return;
    clearDemoEventsLocal();
    sessionStorage.setItem(DEMO_RECORDING_ACTIVE_KEY, "1");
    setRecording(true);
    lastNavPath.current = null;
    try {
      await fetch("/api/admin/demo-record/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ sessionId: getInvestorDemoSessionIdClient() }),
      });
    } catch {
      /* ignore */
    }
    const nav: DemoRecordedEvent = {
      type: "NAVIGATION",
      path: pathname ?? "/",
      timestamp: Date.now(),
      metadata: { source: "record_start" },
    };
    recordDemoEvent(nav);
    void mirrorEventToServer(nav);
  }, [demoUxActive, pathname]);

  const stopRecording = useCallback(() => {
    sessionStorage.removeItem(DEMO_RECORDING_ACTIVE_KEY);
    setRecording(false);
  }, []);

  const abortReplay = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    try {
      sessionStorage.removeItem(DEMO_REPLAY_ACTIVE_KEY);
    } catch {
      /* ignore */
    }
    setReplaying(false);
    setPulseHint(null);
  }, []);

  const runReplay = useCallback(async (): Promise<boolean> => {
    if (!demoUxActive) return false;

    let events = loadDemoEventsLocal();
    if (events.length === 0) {
      try {
        const sid = getInvestorDemoSessionIdClient();
        const res = await fetch(`/api/admin/demo-record/events?sessionId=${encodeURIComponent(sid)}`, {
          credentials: "same-origin",
        });
        const data = (await res.json()) as { ok?: boolean; events?: DemoRecordedEvent[] };
        if (data.ok && Array.isArray(data.events)) {
          events = data.events;
        }
      } catch {
        /* ignore */
      }
    }
    if (events.length === 0) return false;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      sessionStorage.setItem(DEMO_REPLAY_ACTIVE_KEY, "1");
    } catch {
      /* ignore */
    }
    setReplaying(true);
    setPulseHint(null);

    let finishedCleanly = false;
    try {
      await replayDemoSession(events, {
        signal: ac.signal,
        navigate: (p) => {
          router.push(p as never);
        },
        onUiPulse: (h) => setPulseHint(h),
        stepDelayMs: 650,
      });
      finishedCleanly = !ac.signal.aborted;
    } catch {
      finishedCleanly = false;
    } finally {
      try {
        sessionStorage.removeItem(DEMO_REPLAY_ACTIVE_KEY);
      } catch {
        /* ignore */
      }
      setReplaying(false);
      setPulseHint(null);
      abortRef.current = null;
    }
    return finishedCleanly;
  }, [demoUxActive, router]);

  const value = useMemo(
    (): InvestorDemoRecordingContextValue => ({
      demoUxActive,
      recording,
      replaying,
      pulseHint,
      beginRecording,
      stopRecording,
      runReplay,
      abortReplay,
    }),
    [demoUxActive, recording, replaying, pulseHint, beginRecording, stopRecording, runReplay, abortReplay],
  );

  return (
    <InvestorDemoRecordingContext.Provider value={value}>
      {children}
      <DemoRecordingReplayBanner />
      {pulseHint ? (
        <div className="pointer-events-none fixed bottom-28 left-1/2 z-[60] max-w-md -translate-x-1/2 rounded-xl border border-violet-400 bg-violet-50 px-4 py-2 text-center text-xs font-semibold text-violet-950 shadow-lg">
          Replay pulse: {pulseHint}
        </div>
      ) : null}
    </InvestorDemoRecordingContext.Provider>
  );
}

function DemoRecordingReplayBanner() {
  const ctx = useContext(InvestorDemoRecordingContext);
  if (!ctx?.demoUxActive) return null;
  const { recording, replaying } = ctx;
  if (!recording && !replaying) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[55] border-t border-violet-500 bg-violet-100 px-4 py-2 text-center text-sm font-semibold text-violet-950"
    >
      {replaying ? "🎥 Demo Replay Mode" : "🎥 Recording demo interactions"}
    </div>
  );
}
