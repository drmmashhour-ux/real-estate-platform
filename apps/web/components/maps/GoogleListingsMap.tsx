"use client";

/**
 * Google Maps for listings explorer. Missing key ⇒ fallback only — SDK hook runs only when a key exists.
 */

import { useCallback, useMemo } from "react";
import {
  GoogleMap,
  OverlayView,
  useJsApiLoader,
} from "@react-google-maps/api";

const MAP_SCRIPT_ID = "lecipm-listings-google-maps";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const DEFAULT_CENTER = { lat: 45.5017, lng: -73.5673 };

const shellClass =
  "relative flex w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-black text-neutral-400";

function fallback(message: string) {
  return (
    <div
      className={`${shellClass} h-full min-h-[400px] items-center justify-center px-4 text-center text-sm lg:min-h-[min(560px,calc(100vh-7rem))]`}
    >
      {message}
    </div>
  );
}

function parseNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Browse API rows (`latitude`/`longitude`) or `{ lat, lng }`. */
function coordsFromListing(raw: unknown): google.maps.LatLngLiteral | null {
  if (raw === null || raw === undefined || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const lat = parseNum(o.lat) ?? parseNum(o.latitude);
  const lng = parseNum(o.lng) ?? parseNum(o.longitude);
  if (lat == null || lng == null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function markerKey(li: unknown, index: number, pos: google.maps.LatLngLiteral): string {
  if (li && typeof li === "object" && typeof (li as Record<string, unknown>).id === "string") {
    return (li as Record<string, string>).id;
  }
  return `m-${index}-${pos.lat}-${pos.lng}`;
}

type MapSdkProps = { listings: unknown[]; apiKey: string };

/** Display price chip for OverlayView ($750k from cents). */
function priceChipLabel(listing: unknown): string | null {
  if (listing === null || listing === undefined || typeof listing !== "object") {
    return null;
  }
  const o = listing as Record<string, unknown>;
  const cents = parseNum(o.priceCents);
  if (cents != null && cents >= 0) {
    return `$${Math.round(cents / 100_000)}k`;
  }
  const dollars = parseNum(o.price);
  if (dollars != null && dollars >= 0) {
    return `$${Math.round(dollars / 1000)}k`;
  }
  return null;
}

function PriceMarker({ listing }: { listing: unknown }) {
  const label = priceChipLabel(listing);

  return (
    <div className="pointer-events-auto -translate-x-1/2 -translate-y-full transform bg-[#C9A96A] px-2 py-1 text-xs font-semibold text-black shadow-md transition hover:scale-110 rounded-lg">
      {label ?? "Ask"}
    </div>
  );
}

function GoogleListingsMapWithSdk({ listings, apiKey }: MapSdkProps) {
  const positions = useMemo(() => {
    const out: { listing: unknown; position: google.maps.LatLngLiteral }[] = [];
    for (const li of listings) {
      const position = coordsFromListing(li);
      if (!position) continue;
      out.push({ listing: li, position });
    }
    return out;
  }, [listings]);

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0f0f0f" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0f0f0f" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
      ],
      disableDefaultUI: true,
    }),
    []
  );

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      if (!positions.length) {
        map.setCenter(DEFAULT_CENTER);
        map.setZoom(11);
        return;
      }
      if (positions.length === 1) {
        map.setCenter(positions[0].position);
        map.setZoom(13);
        return;
      }
      const b = new google.maps.LatLngBounds();
      for (const p of positions) b.extend(p.position);
      map.fitBounds(b);
    },
    [positions]
  );

  const { isLoaded, loadError } = useJsApiLoader({
    id: MAP_SCRIPT_ID,
    googleMapsApiKey: apiKey,
  });

  if (loadError) return fallback("Map unavailable");

  if (!isLoaded) return fallback("Loading map…");

  return (
    <div className={`${shellClass} h-full min-h-[400px] w-full lg:min-h-[min(560px,calc(100vh-7rem))]`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        mapContainerClassName="flex h-full min-h-[400px] w-full lg:min-h-0"
        center={DEFAULT_CENTER}
        zoom={11}
        onLoad={onLoad}
        options={mapOptions}
      >
        {/* TODO: Phase 6.5 → clustering */}
        {positions.map(({ listing: li, position }, idx) => (
          <OverlayView
            key={markerKey(li, idx, position)}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            position={position}
          >
            <PriceMarker listing={li} />
          </OverlayView>
        ))}
      </GoogleMap>
    </div>
  );
}

export default function GoogleListingsMap(props: {
  listings: unknown[] | null | undefined;
}) {
  if (!props.listings?.length) return null;

  const rawKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!rawKey?.trim()) {
    return (
      <div className="flex h-full min-h-[200px] w-full items-center justify-center px-4 text-center text-sm text-neutral-400">
        Map unavailable. Please check configuration.
      </div>
    );
  }

  const apiKey = rawKey.trim();
  return <GoogleListingsMapWithSdk listings={props.listings} apiKey={apiKey} />;
}
