"use client";

import { useEffect, useState } from "react";
import type { MapFocusPoint } from "@/components/search/MapSearch";

/**
 * When the user has a location string but no map bbox in the URL, geocode (debounced)
 * so the map can center without writing viewport bounds into the query (avoids over-filtering).
 */
export function useGeocodedMapFocus(location: string, mapBoundsActive: boolean): MapFocusPoint | null {
  const [focus, setFocus] = useState<MapFocusPoint | null>(null);

  useEffect(() => {
    const loc = location.trim();
    if (mapBoundsActive || loc.length < 4) {
      setFocus(null);
      return;
    }

    const ac = new AbortController();
    const t = setTimeout(() => {
      void (async () => {
        try {
          const r = await fetch(`/api/geo/forward-search?q=${encodeURIComponent(loc)}`, {
            signal: ac.signal,
            cache: "no-store",
          });
          if (ac.signal.aborted) return;
          if (!r.ok) {
            setFocus(null);
            return;
          }
          const j = (await r.json()) as { ok?: boolean; lat?: number; lon?: number };
          if (!j.ok || typeof j.lat !== "number" || typeof j.lon !== "number") {
            setFocus(null);
            return;
          }
          setFocus({ lat: j.lat, lng: j.lon });
        } catch {
          if (!ac.signal.aborted) setFocus(null);
        }
      })();
    }, 450);

    return () => {
      ac.abort();
      clearTimeout(t);
    };
  }, [location, mapBoundsActive]);

  return focus;
}
