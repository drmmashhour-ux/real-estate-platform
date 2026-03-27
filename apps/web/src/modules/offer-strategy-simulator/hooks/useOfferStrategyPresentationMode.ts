"use client";

import { useEffect, useState } from "react";
import type { OfferStrategySimulatorMode } from "@/components/deal/offer-strategy-presentation/types";

const PREFIX = "offer-strategy-sim-mode-";

function readMode(listingId: string): OfferStrategySimulatorMode {
  if (typeof window === "undefined") return "client_presentation_mode";
  try {
    const raw = localStorage.getItem(`${PREFIX}${listingId}`);
    if (raw === "internal_mode" || raw === "client_presentation_mode") return raw;
  } catch {
    /* ignore */
  }
  return "client_presentation_mode";
}

/**
 * Stays in sync with the Offer Strategy assistant presentation toggle (OfferStrategyCard)
 * and the same localStorage key.
 */
export function useOfferStrategyPresentationMode(propertyId: string): OfferStrategySimulatorMode {
  const [mode, setMode] = useState<OfferStrategySimulatorMode>(() => readMode(propertyId));

  useEffect(() => {
    setMode(readMode(propertyId));
  }, [propertyId]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === `${PREFIX}${propertyId}` && e.newValue) {
        if (e.newValue === "internal_mode" || e.newValue === "client_presentation_mode") {
          setMode(e.newValue);
        }
      }
    };
    const onCustom = (e: Event) => {
      const ce = e as CustomEvent<{ listingId: string; mode: OfferStrategySimulatorMode }>;
      if (ce.detail?.listingId === propertyId) setMode(ce.detail.mode);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("lecipm-offer-strategy-presentation-mode", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("lecipm-offer-strategy-presentation-mode", onCustom as EventListener);
    };
  }, [propertyId]);

  return mode;
}
