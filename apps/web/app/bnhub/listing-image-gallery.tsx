"use client";

import { useCallback, useState } from "react";

export type ListingGalleryBadges = {
  isNew?: boolean;
  isFeatured?: boolean;
  priceDrop?: boolean;
};

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide shadow-lg ${className}`}
    >
      {children}
    </span>
  );
}

export function ListingImageGallery({
  photos,
  badges,
  listingId,
  imageAltBase,
}: {
  photos: string[];
  badges?: ListingGalleryBadges;
  /** For analytics when navigating gallery */
  listingId?: string;
  /** Used for descriptive alt text (e.g. listing title). */
  imageAltBase?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const logGalleryNav = useCallback(
    (nextIndex: number) => {
      if (!listingId || nextIndex === selectedIndex) return;
      fetch("/api/ai/activity", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "listing_gallery_nav",
          listingId,
          metadata: { fromIndex: selectedIndex, toIndex: nextIndex },
        }),
      }).catch(() => {});
    },
    [listingId, selectedIndex]
  );

  const goTo = useCallback(
    (i: number) => {
      const next = ((i % photos.length) + photos.length) % photos.length;
      logGalleryNav(next);
      setSelectedIndex(next);
    },
    [photos.length, logGalleryNav]
  );

  if (!photos.length) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-slate-800 bg-slate-800 text-slate-500">
        No photos
      </div>
    );
  }

  const mainSrc = photos[selectedIndex];
  const altRoot = (imageAltBase ?? "Property").trim() || "Property";

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <img
          src={mainSrc}
          alt={`${altRoot} — photo ${selectedIndex + 1} of ${photos.length}`}
          width={1200}
          height={720}
          decoding="async"
          fetchPriority={selectedIndex === 0 ? "high" : "auto"}
          loading={selectedIndex === 0 ? "eager" : "lazy"}
          className="aspect-[5/3] max-h-[min(70vh,520px)] w-full object-cover sm:aspect-[16/9]"
        />
        {(badges?.isNew || badges?.isFeatured || badges?.priceDrop) && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {badges.isNew ? <Badge className="bg-sky-500 text-white">New</Badge> : null}
            {badges.isFeatured ? <Badge className="bg-amber-500 text-slate-900">Featured</Badge> : null}
            {badges.priceDrop ? <Badge className="bg-rose-500 text-white">Price drop</Badge> : null}
          </div>
        )}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(selectedIndex - 1)}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/85 text-lg text-slate-100 shadow-lg ring-1 ring-white/10 hover:bg-slate-800"
              aria-label="Previous photo"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => goTo(selectedIndex + 1)}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/85 text-lg text-slate-100 shadow-lg ring-1 ring-white/10 hover:bg-slate-800"
              aria-label="Next photo"
            >
              →
            </button>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10">
              {selectedIndex + 1} / {photos.length}
            </span>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1 scroll-smooth [-webkit-overflow-scrolling:touch]"
          role="tablist"
          aria-label="Photo thumbnails"
        >
          {photos.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === selectedIndex}
              onClick={() => goTo(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === selectedIndex
                  ? "border-emerald-500 ring-2 ring-emerald-500/40"
                  : "border-slate-700 hover:border-slate-600"
              }`}
            >
              <img
                src={url}
                alt={`${altRoot} — thumbnail ${i + 1}`}
                width={96}
                height={64}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
