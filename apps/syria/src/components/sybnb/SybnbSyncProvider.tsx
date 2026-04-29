"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  pendingSybnbSyncCount,
  failedSybnbSyncCount,
  retryFailedSybnbSyncItems,
} from "@/lib/sybnb/sync-queue";
import { connectSybnbWS } from "@/lib/sybnb/ws-client";
import { runSync, type SybnbSyncPhase } from "@/lib/sybnb/sync-engine";

type Ctx = {
  phase: SybnbSyncPhase;
  pendingCount: number;
  failedCount: number;
  runSyncNow: () => Promise<void>;
  subscribeRefresh: (fn: () => void) => () => void;
  retryFailedSync: () => void;
};

/** Production-safe fallback when WebSocket is disconnected (no heavy 22s polling). */
const FALLBACK_POLL_MS = 60_000;

const SybnbSyncCtx = createContext<Ctx>({
  phase: "idle",
  pendingCount: 0,
  failedCount: 0,
  runSyncNow: async () => {},
  subscribeRefresh: () => () => {},
  retryFailedSync: () => {},
});

export function useSybnbSync(): Ctx {
  return useContext(SybnbSyncCtx);
}

export function SybnbSyncProvider(props: { children: React.ReactNode }) {
  const syncActive = true;
  const router = useRouter();
  const t = useTranslations("Sybnb.v1");
  const [phase, setPhase] = useState<SybnbSyncPhase>("idle");
  const [tick, setTick] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [bookingConflictBanner, setBookingConflictBanner] = useState<string | null>(null);
  const listenersRef = useRef(new Set<() => void>());
  const debounceSyncRef = useRef<number | null>(null);
  const conflictBannerTimerRef = useRef<number | null>(null);

  const bumpPending = useCallback(() => setTick((x) => x + 1), []);

  const notifyRefresh = useCallback(() => {
    listenersRef.current.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    });
  }, []);

  const runSyncNow = useCallback(async () => {
    if (!syncActive) return;
    const pendingBefore = pendingSybnbSyncCount();
    if (pendingBefore === 0 && failedSybnbSyncCount() === 0) {
      setPhase("idle");
      return;
    }
    setPhase((p) => (p === "syncing" ? p : "pending"));
    const r = await runSync({
      onPhase: setPhase,
      onSynced: () => {
        notifyRefresh();
      },
      onBookingConflict: () => {
        notifyRefresh();
        router.refresh();
        if (conflictBannerTimerRef.current != null) {
          window.clearTimeout(conflictBannerTimerRef.current);
        }
        setBookingConflictBanner(t("bookingConflictRefresh"));
        conflictBannerTimerRef.current = window.setTimeout(() => {
          conflictBannerTimerRef.current = null;
          setBookingConflictBanner(null);
        }, 8000);
      },
    });
    if (r.processed > 0) {
      notifyRefresh();
      router.refresh();
    }
    if (r.processed === 0 && pendingSybnbSyncCount() > 0) {
      setPhase((ph) => (ph === "paused" ? ph : "failed"));
    }
    bumpPending();
  }, [syncActive, bumpPending, notifyRefresh, router, t]);

  const retryFailedSync = useCallback(() => {
    retryFailedSybnbSyncItems();
    bumpPending();
    void runSyncNow();
  }, [bumpPending, runSyncNow]);

  const subscribeRefresh = useCallback((fn: () => void) => {
    listenersRef.current.add(fn);
    return () => void listenersRef.current.delete(fn);
  }, []);

  useEffect(() => {
    if (!syncActive || typeof window === "undefined") return undefined;
    return connectSybnbWS({
      onMessage: (event) => {
        if (event.type === "booking_updated" || event.type === "message") {
          notifyRefresh();
          router.refresh();
        }
      },
      onConnectedChange: setWsConnected,
    });
  }, [syncActive, notifyRefresh, router]);

  useEffect(() => {
    if (!syncActive || typeof window === "undefined") return undefined;
    const onQueueChanged = () => {
      bumpPending();
      if (debounceSyncRef.current != null) window.clearTimeout(debounceSyncRef.current);
      debounceSyncRef.current = window.setTimeout(() => {
        debounceSyncRef.current = null;
        void runSyncNow();
      }, 550);
    };
    window.addEventListener("sybnb-sync-queue-changed", onQueueChanged);
    return () => {
      window.removeEventListener("sybnb-sync-queue-changed", onQueueChanged);
      if (debounceSyncRef.current != null) window.clearTimeout(debounceSyncRef.current);
    };
  }, [syncActive, bumpPending, runSyncNow]);

  useEffect(() => {
    if (!syncActive || typeof window === "undefined") return undefined;
    void runSyncNow();
    const onOnline = () => void runSyncNow();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [syncActive, runSyncNow]);

  /** Fallback when WebSocket is disabled or disconnected (e.g. Vercel). */
  useEffect(() => {
    if (!syncActive || typeof window === "undefined") return undefined;
    if (wsConnected) return undefined;
    const id = window.setInterval(() => {
      if (!navigator.onLine) return;
      void runSyncNow();
    }, FALLBACK_POLL_MS);
    return () => window.clearInterval(id);
  }, [syncActive, runSyncNow, wsConnected]);

  useEffect(() => {
    return () => {
      if (conflictBannerTimerRef.current != null) window.clearTimeout(conflictBannerTimerRef.current);
    };
  }, []);

  const pendingCount = useMemo(() => {
    void tick;
    return pendingSybnbSyncCount();
  }, [tick]);

  const failedCount = useMemo(() => {
    void tick;
    return failedSybnbSyncCount();
  }, [tick]);

  const value = useMemo<Ctx>(
    () => ({
      phase,
      pendingCount,
      failedCount,
      runSyncNow,
      subscribeRefresh,
      retryFailedSync,
    }),
    [phase, pendingCount, failedCount, runSyncNow, subscribeRefresh, retryFailedSync],
  );

  return (
    <>
      {bookingConflictBanner ? (
        <div
          role="status"
          className="sticky top-0 z-[92] border-b border-amber-300/90 bg-amber-100 px-3 py-2 text-center text-xs font-medium text-amber-950 [dir=rtl]:text-right"
        >
          {bookingConflictBanner}
        </div>
      ) : null}
      <SybnbSyncCtx.Provider value={value}>{props.children}</SybnbSyncCtx.Provider>
    </>
  );
}
