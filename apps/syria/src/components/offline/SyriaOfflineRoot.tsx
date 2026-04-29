"use client";

import { useEffect } from "react";
import { syriaFlags } from "@/lib/platform-flags";
import {
  persistSyriaSessionSnapshotRemote,
  SyriaOfflineProvider,
} from "./SyriaOfflineProvider";
import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import { SybnbSyncProvider } from "@/components/sybnb/SybnbSyncProvider";
import { SybnbSyncRibbon } from "@/components/sybnb/SybnbSyncRibbon";

function SyriaServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);

  return null;
}

function SyriaOfflineEffects() {
  useEffect(() => {
    if (!syriaFlags.SYRIA_OFFLINE_FIRST) return;

    void persistSyriaSessionSnapshotRemote();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        void persistSyriaSessionSnapshotRemote();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return null;
}

export function SyriaOfflineRoot(props: { children: React.ReactNode }) {
  const enabled = syriaFlags.SYRIA_OFFLINE_FIRST;
  return (
    <SyriaOfflineProvider offlineFirstEnabled={enabled}>
      <SybnbSyncProvider>
        <SyriaServiceWorkerRegister />
        {enabled ? <SyriaOfflineEffects /> : null}
        <PwaInstallBanner />
        <SybnbSyncRibbon />
        {props.children}
      </SybnbSyncProvider>
    </SyriaOfflineProvider>
  );
}
