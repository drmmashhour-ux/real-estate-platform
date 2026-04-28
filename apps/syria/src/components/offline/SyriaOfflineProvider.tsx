"use client";

import type { OfflineAction } from "@repo/offline";
import {
  drainOfflineQueue,
  getMeta,
  isNavigatorOnline,
  listQueuedActions,
  putMeta,
  subscribeOffline,
  subscribeOnline,
} from "@repo/offline";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SYRIA_OFFLINE_NAMESPACE, SYRIA_SESSION_META_KEY } from "@/lib/offline/constants";
import { SyriaOfflineChrome } from "./SyriaOfflineChrome";

export type SyriaOfflineState = {
  online: boolean;
  pendingQueueHint: boolean;
};

type Ctx = SyriaOfflineState & {
  refreshQueueHint: () => Promise<void>;
  runSyncNow: () => Promise<void>;
};

const OfflineCtx = createContext<Ctx>({
  online: true,
  pendingQueueHint: false,
  refreshQueueHint: async () => {},
  runSyncNow: async () => {},
});

export function useSyriaOffline(): Ctx {
  return useContext(OfflineCtx);
}

async function hydrateQueueHint(namespace: string): Promise<boolean> {
  const pending = await listQueuedActions(namespace);
  return pending.length > 0;
}

export function SyriaOfflineProvider(props: { offlineFirstEnabled: boolean; children: React.ReactNode }) {
  const { offlineFirstEnabled, children } = props;
  const [online, setOnline] = useState(true);
  const [pendingHint, setPendingHint] = useState(false);

  const refreshQueueHint = useCallback(async () => {
    const h = await hydrateQueueHint(SYRIA_OFFLINE_NAMESPACE).catch(() => false);
    setPendingHint(Boolean(h));
  }, []);

  const runSyncNow = useCallback(async () => {
    if (!offlineFirstEnabled) return;
    const { executeSyriaOfflineAction } = await import("@/lib/offline/syria-queue-executor");
    await drainOfflineQueue({
      namespace: SYRIA_OFFLINE_NAMESPACE,
      executeOne: executeSyriaOfflineAction,
      onDropped: () => {},
    });
    await refreshQueueHint();
  }, [offlineFirstEnabled, refreshQueueHint]);

  useEffect(() => {
    setOnline(isNavigatorOnline());
    void refreshQueueHint();
  }, [refreshQueueHint]);

  useEffect(() => {
    if (!offlineFirstEnabled) return undefined;
    const up = subscribeOnline(() => {
      setOnline(true);
      void runSyncNow();
    });
    const down = subscribeOffline(() => {
      setOnline(false);
      void refreshQueueHint();
    });
    return () => {
      up();
      down();
    };
  }, [offlineFirstEnabled, refreshQueueHint, runSyncNow]);

  useEffect(() => {
    if (!offlineFirstEnabled || typeof window === "undefined") return undefined;
    const id = window.setInterval(() => {
      void runSyncNow();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [offlineFirstEnabled, runSyncNow]);

  const value = useMemo<Ctx>(
    () => ({
      online,
      pendingQueueHint: pendingHint,
      refreshQueueHint,
      runSyncNow,
    }),
    [online, pendingHint, refreshQueueHint, runSyncNow],
  );

  return (
    <>
      {offlineFirstEnabled ? <SyriaOfflineChrome online={online} pendingQueueHint={pendingHint} /> : null}
      <OfflineCtx.Provider value={value}>{children}</OfflineCtx.Provider>
    </>
  );
}

export async function persistSyriaSessionSnapshotRemote(): Promise<void> {
  try {
    const res = await fetch("/api/session/snapshot", { credentials: "include", cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return;
    await putMeta(SYRIA_OFFLINE_NAMESPACE, SYRIA_SESSION_META_KEY, { ...body, savedAt: Date.now() });
  } catch {
    /* ignore */
  }
}

export async function readSyriaSessionSnapshot(): Promise<{
  userId?: string;
  role?: string;
  savedAt?: number;
} | null> {
  const row = await getMeta(SYRIA_OFFLINE_NAMESPACE, SYRIA_SESSION_META_KEY);
  return row ?? null;
}

/** For queue diagnostics / future UI */
export type { OfflineAction };
