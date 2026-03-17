"use client";

import { useState } from "react";

export function ListingImageGallery({ photos }: { photos: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!photos.length) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-slate-800 bg-slate-800 text-slate-500">
        No photos
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <img
          src={photos[selectedIndex]}
          alt=""
          className="h-80 w-full object-cover sm:h-96"
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setSelectedIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/80 text-slate-100 shadow hover:bg-slate-800"
              aria-label="Previous photo"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setSelectedIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/80 text-slate-100 shadow hover:bg-slate-800"
              aria-label="Next photo"
            >
              →
            </button>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-200">
              {selectedIndex + 1} / {photos.length}
            </span>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 object-cover transition ${
                i === selectedIndex
                  ? "border-emerald-500 ring-2 ring-emerald-500/40"
                  : "border-slate-700 hover:border-slate-600"
              }`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
