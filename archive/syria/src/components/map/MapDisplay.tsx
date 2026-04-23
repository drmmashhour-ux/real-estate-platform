"use client";

import { useMemo } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { DAMASCUS_CENTER } from "@/components/map/MapPicker";
import { fuzzLatLngForDisplay } from "@/lib/geo";

const mapContainerStyle = { width: "100%", height: "100%" };

const libraries: ("places")[] = ["places"];

export type MapDisplayProps = {
  latitude: number;
  longitude: number;
  /** When set, marker is shifted deterministically for public maps (privacy). */
  fuzzSeed?: string;
  zoom?: number;
  height?: number;
  className?: string;
};

function MapDisplayLoaded({
  latitude,
  longitude,
  fuzzSeed,
  zoom = 11,
  height = 220,
  className,
}: MapDisplayProps) {
  const center = useMemo(() => {
    const raw = fuzzSeed ? fuzzLatLngForDisplay(fuzzSeed, latitude, longitude) : { lat: latitude, lng: longitude };
    return raw;
  }, [latitude, longitude, fuzzSeed]);

  const options = useMemo<google.maps.MapOptions>(
    () => ({
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: "greedy",
      draggable: false,
      scrollwheel: false,
      minZoom: 5,
      maxZoom: 17,
    }),
    [],
  );

  const { isLoaded, loadError } = useJsApiLoader({
    id: "darlink-google-map-display",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  if (loadError || !isLoaded) {
    return (
      <div
        className={`flex items-center justify-center rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)] text-xs text-[color:var(--darlink-text-muted)] ${className ?? ""}`}
        style={{ height }}
      >
        {loadError ? "Map unavailable" : "Loading…"}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] ${className ?? ""}`} style={{ height }}>
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={zoom} options={options}>
        <Marker position={center} />
      </GoogleMap>
    </div>
  );
}

/** Read-only map showing one position (privacy fuzz optional). Returns null when API key missing. */
export function MapDisplay(props: MapDisplayProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  if (!apiKey.trim()) {
    return (
      <div
        className={`flex flex-col justify-center rounded-[var(--darlink-radius-xl)] border border-dashed border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)] px-3 py-6 text-center text-xs text-[color:var(--darlink-text-muted)] ${props.className ?? ""}`}
        style={{ height: props.height ?? 220 }}
      >
        Maps key not configured
      </div>
    );
  }
  return <MapDisplayLoaded {...props} />;
}
