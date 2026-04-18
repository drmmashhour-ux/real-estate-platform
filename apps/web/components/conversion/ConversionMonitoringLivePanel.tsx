"use client";

import { useEffect, useState } from "react";
import {
  getConversionMonitoringRecentEvents,
  getConversionMonitoringSnapshot,
} from "@/modules/conversion/conversion-monitoring.service";

/**
 * Fixed debug HUD — only mounted when caller enables (NEXT_PUBLIC_CONVERSION_MONITORING_DEBUG).
 * Shows in-browser in-process counters for the current tab session.
 */
export function ConversionMonitoringLivePanel() {
  const [snap, setSnap] = useState(() => getConversionMonitoringSnapshot());
  const [events, setEvents] = useState(() => getConversionMonitoringRecentEvents());

  useEffect(() => {
    const id = window.setInterval(() => {
      setSnap(getConversionMonitoringSnapshot());
      setEvents(getConversionMonitoringRecentEvents());
    }, 1200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="fixed bottom-3 right-3 z-[60] max-h-[min(50vh,320px)] w-[min(100vw-24px,280px)] overflow-auto rounded-lg border border-amber-700/50 bg-black/90 p-2 text-[10px] text-amber-100 shadow-xl"
      aria-label="Conversion monitoring debug"
    >
      <p className="font-semibold text-amber-300">Conversion monitoring (this tab)</p>
      <p className="mt-0.5 text-[9px] text-slate-500">In-process only · not durable</p>
      <ul className="mt-2 space-y-0.5 font-mono text-[9px] text-slate-300">
        <li>leadFormStarts: {snap.leadFormStarts}</li>
        <li>leadSubmits: {snap.leadSubmits}</li>
        <li>listingCta: {snap.listingCtaClicks}</li>
        <li>propertyCta: {snap.propertyCtaClicks}</li>
        <li>brokerPreview: {snap.brokerPreviewCtaClicks}</li>
      </ul>
      <p className="mt-2 font-mono text-[8px] text-slate-500">
        surfaces: {JSON.stringify(snap.surfaceViewsByKey ?? {})}
      </p>
      {events.length > 0 ? (
        <ul className="mt-2 max-h-24 overflow-y-auto border-t border-white/10 pt-2 text-[8px] text-slate-400">
          {events.slice(-10).map((e, i) => (
            <li key={`${e.ts}-${i}`}>
              {e.kind}
              {e.meta?.surface != null ? ` · ${String(e.meta.surface)}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
