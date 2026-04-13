"use client";

import { useEffect, useRef } from "react";
import type { ExperimentEventName } from "@/lib/experiments/constants";

export type ExperimentTrackPayload = {
  experimentId: string;
  variantId: string;
};

/**
 * Fires a single analytics event per resolved experiment (deduped per mount).
 */
export function ExperimentExposureTracker({
  surfaces,
  eventName,
  metadata,
}: {
  surfaces: ExperimentTrackPayload[];
  eventName: ExperimentEventName;
  metadata?: Record<string, unknown>;
}) {
  const sent = useRef(false);
  const key = surfaces.map((s) => `${s.experimentId}:${s.variantId}`).join("|");
  const metaKey = metadata ? JSON.stringify(metadata) : "";

  useEffect(() => {
    sent.current = false;
  }, [key]);

  useEffect(() => {
    if (sent.current) return;
    if (surfaces.length === 0) return;
    sent.current = true;
    for (const s of surfaces) {
      void fetch("/api/experiments/track", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experimentId: s.experimentId,
          variantId: s.variantId,
          eventName,
          metadata: metadata ?? {},
        }),
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- metadata covered by metaKey
  }, [key, eventName, metaKey, surfaces]);

  return null;
}
