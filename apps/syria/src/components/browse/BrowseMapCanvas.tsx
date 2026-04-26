"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { DAMASCUS_CENTER } from "@/components/map/MapPicker";
import type { SerializedBrowseListing } from "@/services/search/search.service";

const libraries: ("places")[] = ["places"];

function boundsToSearchCircle(bounds: google.maps.LatLngBounds): { lat: number; lng: number; radiusKm: number } {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const lat = (ne.lat() + sw.lat()) / 2;
  const lng = (ne.lng() + sw.lng()) / 2;
  const latKm = Math.abs(ne.lat() - sw.lat()) * 111;
  const lngKm = Math.abs(ne.lng() - sw.lng()) * 111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.15);
  const radiusKm = Math.max((Math.max(latKm, lngKm) / 2) * 1.15, 1);
  return { lat, lng, radiusKm };
}

export type BrowseMapCanvasProps = {
  listings: SerializedBrowseListing[];
  selectedId?: string | null;
  onMarkerClick?: (id: string) => void;
  onSearchThisArea?: (payload: { lat: number; lng: number; radiusKm: number }) => void;
  searchAreaLabel: string;
  height?: number;
};

function BrowseMapCanvasLoaded({
  listings,
  selectedId,
  onMarkerClick,
  onSearchThisArea,
  searchAreaLabel,
  height = 320,
}: BrowseMapCanvasProps) {
  const mapRef = useRef<google.maps.Map | null>(null);

  const markers = useMemo(() => listings.filter((l) => l.latitude != null && l.longitude != null), [listings]);

  const fitBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps || markers.length === 0) return;
    const b = new google.maps.LatLngBounds();
    for (const m of markers) {
      b.extend({ lat: m.latitude!, lng: m.longitude! });
    }
    map.fitBounds(b, 48);
  }, [markers]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "darlink-browse-map",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (markers.length > 0) {
        fitBounds();
      } else {
        map.setCenter(DAMASCUS_CENTER);
        map.setZoom(7);
      }
    },
    [fitBounds, markers.length],
  );

  useEffect(() => {
    fitBounds();
  }, [fitBounds]);

  if (loadError || !isLoaded) {
    return (
      <div className="flex items-center justify-center rounded-[var(--darlink-radius-xl)] bg-[color:var(--darlink-surface-muted)] text-sm text-[color:var(--darlink-text-muted)]" style={{ height }}>
        {loadError ? "Failed to load map" : "Loading map…"}
      </div>
    );
  }

  const center = markers[0] ? { lat: markers[0].latitude!, lng: markers[0].longitude! } : DAMASCUS_CENTER;

  return (
    <div className="relative flex flex-col gap-2">
      <div className="overflow-hidden rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)]" style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={center}
          zoom={markers.length ? 11 : 7}
          onLoad={onLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            gestureHandling: "greedy",
          }}
        >
          {markers.map((m) => (
            <Marker
              key={m.id}
              position={{ lat: m.latitude!, lng: m.longitude! }}
              onClick={() => onMarkerClick?.(m.id)}
              opacity={selectedId === m.id ? 1 : 0.85}
              zIndex={selectedId === m.id ? 100 : 1}
            />
          ))}
        </GoogleMap>
      </div>
      {onSearchThisArea ? (
        <button
          type="button"
          onClick={() => {
            const map = mapRef.current;
            if (!map || !window.google?.maps) return;
            const b = map.getBounds();
            if (!b) return;
            onSearchThisArea(boundsToSearchCircle(b));
          }}
          className="hadiah-btn-primary absolute bottom-3 left-1/2 z-[1] min-h-[44px] -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-[var(--darlink-shadow-md)]"
        >
          {searchAreaLabel}
        </button>
      ) : null}
    </div>
  );
}

export function BrowseMapCanvas(props: BrowseMapCanvasProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  if (!apiKey.trim()) {
    return (
      <div
        className="flex items-center justify-center rounded-[var(--darlink-radius-xl)] border border-dashed border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)] px-3 text-center text-sm text-[color:var(--darlink-text-muted)]"
        style={{ height: props.height ?? 320 }}
      >
        Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for map view.
      </div>
    );
  }
  return <BrowseMapCanvasLoaded {...props} />;
}
