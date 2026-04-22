"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import Link from "next/link";
import type { HeatmapGeoJSON } from "./senior-heatmap.service";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapRef } from "react-map-gl/mapbox";
import type { LngLatBoundsLike, SeniorMapPin } from "./senior-map.types";
import {
  boundsFromPins,
  DEFAULT_MAP_CENTER,
  filterPinsVisibleInBounds,
} from "./senior-map.service";

/** Gold pins + darker selected (brand-friendly, high contrast on light map). */
const PIN_GOLD = "#D4AF37";
const PIN_GOLD_SELECTED = "#B8922A";

export type SeniorMapPanelProps = {
  mapboxToken: string;
  pins: SeniorMapPin[];
  highlightedListId: string | null;
  onPinOpen: (id: string) => void;
  fullScreen?: boolean;
  onExitFullscreen?: () => void;
  largeTouchTargets?: boolean;
  heatmapEnabled?: boolean;
  heatmapGeoJson?: HeatmapGeoJSON | null;
  /** When heatmap turns on, fly here (best scoring zone). */
  bestHeatLngLat?: [number, number] | null;
  /** Bump when parent wants a one-shot fly-to-best after toggling heatmap. */
  /** Increment when enabling “Show Best Areas” so the map flies to the top zone once. */
  heatmapFlyNonce?: number;
  /** Initial framing when results are tied to a city name (browse). */
  initialCityCenter?: { longitude: number; latitude: number; zoom: number } | null;
};

export function SeniorMapPanel(props: SeniorMapPanelProps) {
  const {
    mapboxToken,
    pins,
    highlightedListId,
    onPinOpen,
    fullScreen,
    onExitFullscreen,
    largeTouchTargets,
    heatmapEnabled,
    heatmapGeoJson,
    bestHeatLngLat,
    heatmapFlyNonce,
    initialCityCenter,
  } = props;

  const mapRef = useRef<MapRef>(null);
  const [popupId, setPopupId] = useState<string | null>(null);
  const [viewportBounds, setViewportBounds] = useState<LngLatBoundsLike | null>(null);

  const markersToPlot = useMemo(() => {
    if (!viewportBounds) return pins;
    const v = filterPinsVisibleInBounds(pins, viewportBounds);
    return v.length > 0 ? v : pins;
  }, [pins, viewportBounds]);

  const popupPin = useMemo(() => pins.find((p) => p.id === popupId) ?? null, [pins, popupId]);

  const initialViewState = useMemo(() => {
    const b = boundsFromPins(pins);
    if (b) {
      return {
        bounds: b as [[number, number], [number, number]],
        fitBoundsOptions: {
          padding: { top: 56, bottom: 56, left: 44, right: 44 },
          maxZoom: 12,
        },
      };
    }
    if (initialCityCenter) {
      return {
        longitude: initialCityCenter.longitude,
        latitude: initialCityCenter.latitude,
        zoom: initialCityCenter.zoom,
      };
    }
    return {
      longitude: DEFAULT_MAP_CENTER.longitude,
      latitude: DEFAULT_MAP_CENTER.latitude,
      zoom: DEFAULT_MAP_CENTER.zoom,
    };
  }, [pins, initialCityCenter]);

  useEffect(() => {
    if (!highlightedListId || !mapRef.current) return;
    const pin = pins.find((p) => p.id === highlightedListId);
    if (!pin) return;
    const map = mapRef.current.getMap();
    const z = Math.max(map.getZoom(), 12);
    map.flyTo({
      center: [pin.longitude, pin.latitude],
      zoom: z,
      duration: 550,
      essential: true,
    });
  }, [highlightedListId, pins]);

  useEffect(() => {
    if (!heatmapEnabled || !bestHeatLngLat || !mapRef.current) return;
    if ((heatmapFlyNonce ?? 0) <= 0) return;
    mapRef.current.getMap().flyTo({
      center: bestHeatLngLat,
      zoom: 11.5,
      duration: 900,
      essential: true,
    });
  }, [heatmapEnabled, bestHeatLngLat, heatmapFlyNonce]);

  const openPopup = useCallback(
    (id: string) => {
      setPopupId(id);
      onPinOpen(id);
    },
    [onPinOpen],
  );

  const markerMinClass =
    largeTouchTargets || fullScreen ? "min-h-[52px] min-w-[52px] text-sm" : "min-h-[40px] min-w-[40px] max-w-[120px] text-[11px]";

  const heatmapEmpty =
    !heatmapGeoJson || heatmapGeoJson.features.length === 0;

  return (
    <div
      className={
        fullScreen ?
          "relative flex h-[100dvh] w-full flex-col bg-neutral-50"
        : "relative min-h-[min(420px,58vh)] w-full overflow-hidden rounded-xl border-2 border-neutral-800 bg-neutral-50 lg:min-h-[560px]"
      }
    >
      {fullScreen && onExitFullscreen ?
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between gap-3 border-b-2 border-neutral-800 bg-white/95 px-4 py-3 backdrop-blur-sm">
          <p className="text-base font-bold text-neutral-900">Map</p>
          <button
            type="button"
            className="sl-btn-secondary min-h-[48px] px-5 text-base font-semibold"
            onClick={onExitFullscreen}
          >
            Exit full screen
          </button>
        </div>
      : null}

      <div className={fullScreen ? "relative min-h-0 flex-1 pt-[52px]" : "relative h-full min-h-[320px]"}>
        <Map
          key={pins.map((p) => p.id).join("|")}
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          mapStyle="mapbox://styles/mapbox/light-v11"
          reuseMaps
          attributionControl={false}
          initialViewState={initialViewState}
          style={{ width: "100%", height: "100%" }}
          scrollZoom
          dragRotate={false}
          pitchWithRotate={false}
          touchPitch={false}
          onLoad={() => {
            setViewportBounds(null);
            try {
              mapRef.current?.getMap().resize();
            } catch {
              /* ignore */
            }
          }}
          onMoveEnd={(e) => {
            const b = e.target.getBounds();
            setViewportBounds({
              west: b.getWest(),
              south: b.getSouth(),
              east: b.getEast(),
              north: b.getNorth(),
            });
          }}
        >
          <NavigationControl position="top-right" showCompass={false} />

          {heatmapEnabled && !heatmapEmpty && heatmapGeoJson ?
            <Source id="sl-heat" type="geojson" data={heatmapGeoJson}>
              <Layer
                id="sl-heat-layer"
                type="heatmap"
                paint={{
                  "heatmap-weight": ["coalesce", ["get", "weight"], 0],
                  "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 14, 2.2],
                  "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 8, 18, 14, 42],
                  "heatmap-opacity": 0.72,
                  "heatmap-color": [
                    "interpolate",
                    ["linear"],
                    ["heatmap-density"],
                    0,
                    "rgba(34,139,34,0)",
                    0.25,
                    "rgba(154,205,50,0.55)",
                    0.5,
                    "rgba(255,215,0,0.72)",
                    0.75,
                    "rgba(255,165,0,0.82)",
                    1,
                    "rgba(220,53,69,0.88)",
                  ],
                }}
              />
            </Source>
          : null}

          {markersToPlot.map((pin) => {
            const isHi = pin.id === highlightedListId || pin.id === popupId;
            const bg = isHi ? PIN_GOLD_SELECTED : PIN_GOLD;
            return (
              <Marker key={pin.id} longitude={pin.longitude} latitude={pin.latitude} anchor="center">
                <button
                  type="button"
                  aria-label={`${pin.name}, ${pin.priceLabel}`}
                  className={`flex ${markerMinClass} cursor-pointer items-center justify-center rounded-full border-[3px] border-white px-2 font-bold leading-none text-neutral-900 shadow-lg transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 ${
                    isHi ? "z-10 scale-110 ring-2 ring-amber-700" : "hover:brightness-105"
                  }`}
                  style={{ backgroundColor: bg }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openPopup(pin.id);
                  }}
                >
                  {pin.pinShowsPrice ?
                    <span className="truncate tabular-nums">{pin.pinLabel}</span>
                  : <span className="text-xl leading-none" aria-hidden>
                      🏥
                    </span>
                  }
                </button>
              </Marker>
            );
          })}

          {popupPin ?
            <Popup
              longitude={popupPin.longitude}
              latitude={popupPin.latitude}
              anchor="top"
              offset={largeTouchTargets || fullScreen ? 30 : 20}
              onClose={() => setPopupId(null)}
              closeButton
              closeOnClick={false}
              maxWidth="300px"
            >
              <div className="min-w-[230px] p-2 text-neutral-900">
                <p className="text-lg font-bold leading-snug">{popupPin.name}</p>
                <p className="mt-2 text-base font-semibold">{popupPin.priceLabel}</p>
                <p className="mt-1 text-base text-neutral-800">{popupPin.careLevelLabel}</p>
                <Link
                  href={popupPin.detailHref}
                  className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-neutral-900 px-4 text-center text-base font-bold text-white no-underline hover:bg-neutral-800"
                >
                  View
                </Link>
              </div>
            </Popup>
          : null}
        </Map>

        <div className="pointer-events-none absolute bottom-3 left-3 max-w-[min(100%,280px)] rounded-lg bg-white/95 px-3 py-2 text-xs font-medium leading-snug text-neutral-700 shadow-md backdrop-blur-sm">
          © Mapbox © OpenStreetMap — Light map for easier reading.
        </div>

        {heatmapEnabled ?
          <div className="pointer-events-none absolute left-3 top-14 rounded-lg bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
            <p className="text-sm font-bold text-neutral-900">Best areas for your needs</p>
            <p className="mt-1 text-xs font-medium text-neutral-600">
              Green is stronger · Red is weaker — based on results here.
            </p>
          </div>
        : null}
      </div>
    </div>
  );
}
