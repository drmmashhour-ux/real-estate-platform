"use client";

import { useEffect } from "react";
import { syriaFlags } from "@/lib/platform-flags";
import {
  persistSyriaSessionSnapshotRemote,
  SyriaOfflineProvider,
} from "./SyriaOfflineProvider";

function SyriaOfflineEffects() {
  useEffect(() => {
    if (!syriaFlags.SYRIA_OFFLINE_FIRST) return;

    void persistSyriaSessionSnapshotRemote();

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const path = "/offline-sw.js";
    void navigator.serviceWorker.register(path, { scope: "/" }).catch(() => {});

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
      {enabled ? <SyriaOfflineEffects /> : null}
      {props.children}
    </SyriaOfflineProvider>
  );
}
