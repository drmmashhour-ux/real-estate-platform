"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { ExternalLink } from "lucide-react";
import { getPublicGoogleMapsApiKey } from "@/lib/maps/public-google-maps-key";
import { ExploreLandingOpenMap } from "@/components/explore/ExploreLandingOpenMap";

const MONTREAL = { lat: 45.5017, lng: -73.5673 };
const DEFAULT_ZOOM = 10;

const mapContainerStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: 360,
  borderRadius: "1rem",
};

/** Dark base aligned with explore landing (black / gold shell). */
const mapOptions: google.maps.MapOptions = {
  styles: [
    { elementType: "geometry", stylers: [{ color: "#0b0b0b" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#c4c4c4" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0b0b0b" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1f1f1f" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1620" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
  ],
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

function extractCityFromComponents(components: google.maps.GeocoderAddressComponent[]): string {
  const locality = components.find((c) => c.types.includes("locality"))?.long_name;
  if (locality) return locality;
  const sub = components.find((c) => c.types.includes("sublocality"))?.long_name;
  if (sub) return sub;
  const admin2 = components.find((c) => c.types.includes("administrative_area_level_2"))?.long_name;
  return admin2 ?? "";
}

type Props = {
  mapListingsHref: string;
};

function ExploreLandingGoogleMapWithKey({ mapListingsHref, apiKey }: Props & { apiKey: string }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "explore-landing-google-map",
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [cityForListings, setCityForListings] = useState<string | null>(null);
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);

  const quebecBounds = useMemo(() => {
    if (typeof google === "undefined" || !google.maps) return undefined;
    return new google.maps.LatLngBounds(
      new google.maps.LatLng(44.95, -79.6),
      new google.maps.LatLng(47.65, -63.85)
    );
  }, [isLoaded]);

  const onMapLoad = useCallback((m: google.maps.Map) => {
    mapRef.current = m;
  }, []);

  const onPlaceChanged = useCallback(() => {
    const ac = autocompleteRef.current;
    if (!ac) return;
    const place = ac.getPlace();
    const loc = place.geometry?.location;
    if (!loc) return;
    const lat = loc.lat();
    const lng = loc.lng();
    setMarker({ lat, lng });
    setPlaceLabel(place.formatted_address ?? place.name ?? null);
    const comps = place.address_components ?? [];
    const city = extractCityFromComponents(comps);
    setCityForListings(city || null);
    mapRef.current?.panTo({ lat, lng });
    mapRef.current?.setZoom(13);
  }, []);

  const listingsNearHref = useMemo(() => {
    if (!cityForListings) return mapListingsHref;
    const u = new URL(mapListingsHref, typeof window !== "undefined" ? window.location.origin : "http://local");
    u.searchParams.set("city", cityForListings);
    u.searchParams.set("mapLayout", "map");
    return u.pathname + u.search;
  }, [cityForListings, mapListingsHref]);

  const flagIcon = useMemo(
    () =>
      typeof google !== "undefined" && google.maps
        ? {
            url: `${typeof window !== "undefined" ? window.location.origin : ""}/flags/quebec.svg`,
            scaledSize: new google.maps.Size(40, 27),
            anchor: new google.maps.Point(20, 27),
          }
        : undefined,
    [isLoaded]
  );

  if (loadError) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-red-500/30 bg-[#141414] p-8 text-center text-sm text-red-200/90">
        Could not load Google Maps. Check the API key and billing.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-premium-gold/25 bg-[#141414] text-sm text-white/60">
        Loading map…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-premium-gold/35 shadow-[0_24px_80px_rgb(0_0_0/0.45)]">
        <div className="absolute left-3 right-3 top-3 z-[1] flex flex-col gap-2 sm:left-4 sm:right-4 sm:flex-row sm:items-start">
          <Autocomplete
            onLoad={(instance) => {
              autocompleteRef.current = instance;
            }}
            onUnmount={() => {
              autocompleteRef.current = null;
            }}
            onPlaceChanged={onPlaceChanged}
            options={{
              fields: ["address_components", "formatted_address", "geometry", "name"],
              componentRestrictions: { country: "ca" },
              bounds: quebecBounds,
              strictBounds: false,
            }}
          >
            <input
              type="text"
              placeholder="Search places in Canada (e.g. Laval, Québec City, Sherbrooke)"
              className="w-full min-h-[44px] rounded-xl border border-white/20 bg-[#0b0b0b]/95 px-3 py-2.5 pr-10 text-sm text-white shadow-lg backdrop-blur placeholder:text-white/45 focus:border-premium-gold/60 focus:outline-none sm:max-w-md"
              aria-label="Search on Google Maps"
            />
          </Autocomplete>
        </div>
        <div className="aspect-[16/10] min-h-[320px] w-full sm:min-h-[360px]">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={MONTREAL}
            zoom={DEFAULT_ZOOM}
            options={mapOptions}
            onLoad={onMapLoad}
          >
            {marker ? (
              <Marker
                position={marker}
                {...(flagIcon ? { icon: flagIcon } : {})}
                title={placeLabel ?? "Selected place"}
              />
            ) : null}
          </GoogleMap>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-xs text-white/65">
          {placeLabel ? (
            <>
              <span className="text-white/90">{placeLabel}</span>
              {cityForListings ? (
                <>
                  {" "}
                  — listings:{" "}
                  <Link href={listingsNearHref} className="font-semibold text-premium-gold hover:underline">
                    {cityForListings}
                  </Link>
                </>
              ) : null}
            </>
          ) : (
            <>Pan and zoom, or use the search box — then open LECIPM listings on the map.</>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={mapListingsHref}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-premium-gold px-5 text-sm font-bold text-black transition hover:brightness-110"
          >
            Open LECIPM map search
            <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ExploreLandingGoogleMap({ mapListingsHref }: Props) {
  const apiKey = getPublicGoogleMapsApiKey();
  if (apiKey.length === 0) {
    return <ExploreLandingOpenMap mapListingsHref={mapListingsHref} />;
  }
  return <ExploreLandingGoogleMapWithKey mapListingsHref={mapListingsHref} apiKey={apiKey} />;
}
