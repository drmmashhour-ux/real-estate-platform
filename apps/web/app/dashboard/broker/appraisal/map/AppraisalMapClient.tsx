"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import ComparableMap, { type MapComparable } from "@/components/map/ComparableMap";

const DEFAULT_CITY = "Laval";
const DEFAULT_LAT = 45.55;
const DEFAULT_LNG = -73.7;
const DEFAULT_RADIUS = 3;

export function AppraisalMapClient() {
  const searchParams = useSearchParams();
  const subjectListingId = searchParams.get("listingId") ?? "";

  const [city, setCity] = useState(DEFAULT_CITY);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [pickCenterMode, setPickCenterMode] = useState(false);
  const [heatmapOn, setHeatmapOn] = useState(true);
  const [comps, setComps] = useState<MapComparable[]>([]);
  const [selected, setSelected] = useState<MapComparable[]>([]);
  const [loading, setLoading] = useState(false);
  const [addStatus, setAddStatus] = useState<string | null>(null);

  const canFeedAppraisal = subjectListingId.length > 0;

  const loadRadius = useCallback(async () => {
    setLoading(true);
    setAddStatus(null);
    try {
      const res = await fetch("/api/comparables/radius-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          lat: center.lat,
          lng: center.lng,
          radiusKm,
        }),
      });
      const data = (await res.json()) as { success?: boolean; comps?: MapComparable[]; error?: string };
      if (!res.ok) {
        setComps([]);
        setAddStatus(data.error ?? "Search failed");
        return;
      }
      setComps(data.comps ?? []);
    } finally {
      setLoading(false);
    }
  }, [city, center.lat, center.lng, radiusKm]);

  const onMapSelect = useCallback(
    async (c: MapComparable) => {
      setSelected((prev) => (prev.some((p) => p.id === c.id) ? prev : [...prev, c]));
      if (!canFeedAppraisal) {
        setAddStatus("Add ?listingId=… to the URL to push comps into Deal Analyzer.");
        return;
      }
      setAddStatus(null);
      const res = await fetch("/api/appraisal/add-comparable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectListingId,
          comparablePropertyId: c.id,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; deduped?: boolean };
      if (!res.ok) {
        setAddStatus(data.error ?? "Could not attach comparable");
        return;
      }
      setAddStatus(data.deduped ? "Already in analysis." : "Added to deal analysis comparables.");
    },
    [canFeedAppraisal, subjectListingId],
  );

  const hint = useMemo(
    () =>
      canFeedAppraisal
        ? `Feeding analysis for listing ${subjectListingId}`
        : "Optional: open this page with ?listingId=<FSBO id> to attach picks to Deal Analyzer.",
    [canFeedAppraisal, subjectListingId],
  );

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[#D4AF37]">Map-based comparables</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/65">{hint}</p>
        </div>
        <Link
          href="/dashboard/investor/acquisition"
          className="text-sm text-[#D4AF37] underline-offset-4 hover:underline"
        >
          Back to acquisition hub
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          City
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          Radius (km)
          <input
            type="number"
            min={0.5}
            max={50}
            step={0.5}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-28 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          Center
          <div className="text-sm text-white/80">
            {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </div>
        </label>
        <button
          type="button"
          onClick={() => setPickCenterMode((v) => !v)}
          className={`mt-auto rounded-lg px-4 py-2 text-sm font-medium ${
            pickCenterMode ? "bg-[#D4AF37] text-black" : "border border-white/20 bg-white/5 text-white"
          }`}
        >
          {pickCenterMode ? "Click map to set center…" : "Set center on map"}
        </button>
        <label className="mt-auto flex cursor-pointer items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={heatmapOn} onChange={(e) => setHeatmapOn(e.target.checked)} />
          Price heat
        </label>
        <button
          type="button"
          onClick={loadRadius}
          disabled={loading}
          className="mt-auto rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search this radius"}
        </button>
      </div>

      {addStatus ? (
        <p className="text-sm text-amber-200/90" role="status">
          {addStatus}
        </p>
      ) : null}

      <ComparableMap
        comps={comps}
        onSelect={onMapSelect}
        heatmapEnabled={heatmapOn}
        circleCenter={center}
        circleRadiusKm={radiusKm}
        pickCenterMode={pickCenterMode}
        onPickCenter={(ll) => {
          setCenter({ lat: ll.lat, lng: ll.lng });
          setPickCenterMode(false);
        }}
      />

      <div>
        <h2 className="text-lg text-[#D4AF37]">Selected on map</h2>
        {selected.length === 0 ? (
          <p className="text-sm text-white/55">Click markers to select; with listingId, selections sync to Deal Analyzer.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-white/85">
            {selected.map((c) => (
              <li key={c.id}>
                {c.address} — ${((c.salePriceCents ?? c.priceCents) / 100).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
