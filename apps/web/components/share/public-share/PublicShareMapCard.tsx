"use client";

import { MapPin } from "lucide-react";

type LastLoc = {
  lat: number;
  lng: number;
  accuracyMeters: number | null;
  updatedAt: string | null;
};

type Props = {
  liveMode: boolean;
  lastLocation: LastLoc | null;
  mapHref: string | null;
};

export function PublicShareMapCard({ liveMode, lastLocation, mapHref }: Props) {
  if (!liveMode) {
    return (
      <section
        className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-5 text-center"
        aria-label="Location"
      >
        <MapPin className="mx-auto h-8 w-8 text-slate-600" aria-hidden />
        <p className="mt-3 text-sm text-slate-400">Stay status only — map location is not shared for this link.</p>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-inner shadow-black/30"
      aria-label="Map"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <MapPin className="h-4 w-4 text-emerald-400" aria-hidden />
        Map preview
      </div>
      {lastLocation ? (
        <>
          <p className="mt-3 font-mono text-xs text-slate-400">
            {lastLocation.lat.toFixed(4)}, {lastLocation.lng.toFixed(4)}
            {lastLocation.accuracyMeters != null ? (
              <span className="text-slate-500"> · ±{Math.round(lastLocation.accuracyMeters)} m</span>
            ) : null}
          </p>
          {lastLocation.updatedAt ? (
            <p className="mt-1 text-xs text-slate-500">
              Last updated {new Date(lastLocation.updatedAt).toLocaleString()}
            </p>
          ) : null}
          {mapHref ? (
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-full min-h-[48px] items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 sm:w-auto"
            >
              Open map
            </a>
          ) : null}
        </>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Location has not been shared yet. The guest can update location from their booking while sharing is active.
        </p>
      )}
    </section>
  );
}
