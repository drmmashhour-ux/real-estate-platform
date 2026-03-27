"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

const MONTREAL_CENTER = { lat: 45.5017, lng: -73.5673 };
const DEFAULT_ZOOM = 11;
const FEATURED_GOLD = "#C9A96E";

type Project = {
  id: string;
  name: string;
  city?: string;
  startingPrice: number;
  featured?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
};

function getCoords(p: Project): { lat: number; lng: number } {
  if (
    p.latitude != null &&
    p.longitude != null &&
    !Number.isNaN(p.latitude) &&
    !Number.isNaN(p.longitude)
  ) {
    return { lat: p.latitude, lng: p.longitude };
  }
  if ((p.city ?? "").toLowerCase() === "laval") return { lat: 45.6066, lng: -73.7243 };
  return MONTREAL_CENTER;
}

type Props = {
  projects: Project[];
  className?: string;
};

const mapContainerStyle = { width: "100%", height: "100%", minHeight: 400 };
const darkMapOptions: google.maps.MapOptions = {
  styles: [
    { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
    { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#64779e" }] },
    { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
    { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#334e87" }] },
    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#023e58" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
    { featureType: "poi", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c6675" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#144c53" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#1a3646" }] },
    { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#2c6675" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
  ],
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
};

export function ProjectsGoogleMap({ projects, className = "" }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const apiKey = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasKey = !!apiKey && apiKey.trim().length > 0;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: hasKey ? apiKey : "",
    id: "projects-google-map",
  });

  const projectsWithCoords = useMemo(() => {
    return projects.map((p) => ({ ...p, coords: getCoords(p) }));
  }, [projects]);

  const bounds = useMemo(() => {
    if (projectsWithCoords.length === 0) return null;
    const b = new google.maps.LatLngBounds();
    projectsWithCoords.forEach((p) => b.extend(p.coords));
    return b;
  }, [projectsWithCoords]);

  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);
      if (bounds) {
        mapInstance.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      }
    },
    [bounds]
  );

  const onUnmount = useCallback(() => setMap(null), []);

  useEffect(() => {
    if (!map || !bounds) return;
    map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
  }, [map, bounds, projectsWithCoords.length]);

  if (!hasKey) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 p-10 text-center ${className}`}
        style={{ minHeight: 400 }}
      >
        <p className="text-slate-300">Google Maps is not configured.</p>
        <p className="mt-2 text-sm text-slate-500">
          Add <code className="rounded bg-white/10 px-1.5 py-0.5">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to see the map view.
        </p>
        <p className="mt-4 text-slate-400">You can still browse projects in Grid or Heatmap view.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/5 p-10 text-center ${className}`}
        style={{ minHeight: 400 }}
      >
        <p className="text-amber-200">Map failed to load.</p>
        <p className="mt-2 text-sm text-slate-400">Try refreshing or check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-400 ${className}`}
        style={{ minHeight: 400 }}
      >
        Loading map…
      </div>
    );
  }

  return (
    <div
      className={`h-[480px] w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900 ${className}`}
      style={{ minHeight: 400 }}
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={MONTREAL_CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={darkMapOptions}
      >
        {projectsWithCoords.map((p) => (
          <Marker
            key={p.id}
            position={p.coords}
            onClick={() => setSelectedId(p.id)}
            icon={
              p.featured
                ? {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 14,
                    fillColor: FEATURED_GOLD,
                    fillOpacity: 1,
                    strokeColor: "#fff",
                    strokeWeight: 2,
                  }
                : undefined
            }
          />
        ))}
        {selectedId && (() => {
          const p = projectsWithCoords.find((x) => x.id === selectedId);
          if (!p) return null;
          const priceStr =
            p.startingPrice >= 1000
              ? `From $${(p.startingPrice / 1000).toFixed(0)}k`
              : `$${p.startingPrice.toLocaleString()}`;
          return (
            <InfoWindow
              position={p.coords}
              onCloseClick={() => setSelectedId(null)}
            >
              <div className="min-w-[200px] p-1 text-left text-slate-900">
                {p.featured && (
                  <span
                    className="mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-slate-900"
                    style={{ backgroundColor: FEATURED_GOLD }}
                  >
                    Featured
                  </span>
                )}
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-slate-600">{p.city ?? ""} · {priceStr}</p>
                <Link
                  href={`/projects/${p.id}`}
                  className="mt-2 inline-block rounded bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-teal-600"
                >
                  View Project
                </Link>
              </div>
            </InfoWindow>
          );
        })()}
      </GoogleMap>
    </div>
  );
}

