"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

export const DAMASCUS_CENTER = { lat: 33.5138, lng: 36.2765 };

/** Bias Places Autocomplete toward Syria (not a hard clip). */
const SYRIA_BIAS_BOUNDS: google.maps.LatLngBoundsLiteral = {
  east: 42.38,
  north: 37.32,
  south: 32.61,
  west: 35.71,
};

const mapContainerStyle = { width: "100%", height: "100%" };

const libraries: ("places" | "geometry")[] = ["places"];

export type MapPin = { lat: number; lng: number } | null;

export type PlacePickInfo = {
  lat: number;
  lng: number;
  /** Google place name or formatted address snippet — optional helper text only. */
  label: string | null;
};

export type MapPickerProps = {
  value: MapPin;
  onChange: (next: MapPin) => void;
  /** Called when reverse geocode succeeds (informational). */
  onReverseGeocode?: (formattedAddress: string | null) => void;
  enableReverseGeocode?: boolean;
  /** Optional Google Places search above the map — centers map and drops pin when user selects a suggestion. */
  placesSearchEnabled?: boolean;
  placesSearchPlaceholder?: string;
  /** When user picks a place from autocomplete (not from clicking the map). */
  onPlaceResolved?: (info: PlacePickInfo) => void;
  height?: number;
  className?: string;
};

function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.Geocoder) {
      resolve(null);
      return;
    }
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== "OK" || !results?.[0]) resolve(null);
      else resolve(results[0].formatted_address ?? null);
    });
  });
}

function MapPickerLoaded({
  value,
  onChange,
  onReverseGeocode,
  enableReverseGeocode = true,
  placesSearchEnabled = true,
  placesSearchPlaceholder = "",
  onPlaceResolved,
  height = 280,
  className,
}: MapPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "darlink-google-maps",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  const [reverseLabel, setReverseLabel] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const applyLocation = useCallback(
    async (lat: number, lng: number) => {
      onChange({ lat, lng });
      if (!enableReverseGeocode) {
        setReverseLabel(null);
        onReverseGeocode?.(null);
        return;
      }
      const formatted = await reverseGeocode(lat, lng);
      setReverseLabel(formatted);
      onReverseGeocode?.(formatted);
    },
    [enableReverseGeocode, onChange, onReverseGeocode],
  );

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      void applyLocation(e.latLng.lat(), e.latLng.lng());
    },
    [applyLocation],
  );

  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const ll = e.latLng;
      if (!ll) return;
      void applyLocation(ll.lat(), ll.lng());
    },
    [applyLocation],
  );

  useEffect(() => {
    if (!isLoaded || !placesSearchEnabled || !searchInputRef.current || !window.google?.maps?.places) return;

    const input = searchInputRef.current;
    const ac = new google.maps.places.Autocomplete(input, {
      bounds: SYRIA_BIAS_BOUNDS,
      componentRestrictions: { country: "sy" },
      fields: ["geometry", "name", "formatted_address"],
    });

    const listener = ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const loc = place.geometry?.location;
      if (!loc) return;
      const lat = loc.lat();
      const lng = loc.lng();
      const label =
        place.name?.trim() ||
        place.formatted_address?.trim()?.slice(0, 200) ||
        null;
      void applyLocation(lat, lng);
      onPlaceResolved?.({ lat, lng, label });
    });

    return () => {
      google.maps.event.removeListener(listener);
      google.maps.event.clearInstanceListeners(ac);
    };
  }, [isLoaded, placesSearchEnabled, applyLocation, onPlaceResolved]);

  const options = useMemo<google.maps.MapOptions>(
    () => ({
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      gestureHandling: "greedy",
      minZoom: 5,
      maxZoom: 18,
    }),
    [],
  );

  if (loadError) {
    return (
      <div
        className={
          className ??
          "flex flex-col items-center justify-center rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)] p-4 text-center text-sm text-[color:var(--darlink-text-muted)]"
        }
        style={{ height }}
        role="note"
      >
        Could not load Google Maps. Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and enable Maps JavaScript API, Places API, and Geocoding.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={
          className ??
          "flex items-center justify-center rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)] text-sm text-[color:var(--darlink-text-muted)]"
        }
        style={{ height }}
      >
        Loading map…
      </div>
    );
  }

  return (
    <div className={className}>
      {placesSearchEnabled ? (
        <label className="mb-2 block text-xs font-medium text-[color:var(--darlink-text-muted)]">
          <span className="sr-only">Places search</span>
          <input
            ref={searchInputRef}
            type="text"
            autoComplete="off"
            placeholder={placesSearchPlaceholder}
            className="w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2.5 text-sm text-[color:var(--darlink-text)] outline-none placeholder:text-[color:var(--darlink-text-muted)] focus:border-[color:var(--darlink-accent)]"
          />
        </label>
      ) : null}
      <div className="overflow-hidden rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)]" style={{ height }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={value ?? DAMASCUS_CENTER}
          zoom={value ? 14 : 7}
          options={options}
          onClick={onMapClick}
        >
          {value ? <Marker position={value} draggable onDragEnd={onMarkerDragEnd} /> : null}
        </GoogleMap>
      </div>
      {enableReverseGeocode && reverseLabel ? (
        <p className="mt-2 text-xs leading-relaxed text-[color:var(--darlink-text-muted)]">{reverseLabel}</p>
      ) : null}
    </div>
  );
}

export function MapPicker(props: MapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { height = 280, className } = props;

  if (!apiKey.trim()) {
    return (
      <div
        className={
          className ??
          "flex flex-col items-center justify-center rounded-[var(--darlink-radius-xl)] border border-dashed border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)] p-4 text-center text-sm text-[color:var(--darlink-text-muted)]"
        }
        style={{ height }}
        role="note"
      >
        Map picker needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (Maps JavaScript + Places). Pin is required to publish — configure the key to drop a pin.
      </div>
    );
  }

  return <MapPickerLoaded {...props} />;
}
