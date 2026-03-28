"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  images: string[];
  coverImage?: string | null;
  title: string;
};

export function FsboListingGallery({ images, coverImage, title }: Props) {
  const ordered = useMemo(
    () =>
      coverImage && images.includes(coverImage)
        ? [coverImage, ...images.filter((u) => u !== coverImage)]
        : [...images],
    [images, coverImage]
  );

  const galleryKey = useMemo(
    () => `${coverImage ?? ""}|${images.join("||")}`,
    [images, coverImage]
  );

  const [main, setMain] = useState<string | null>(ordered[0] ?? null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const first =
      coverImage && images.includes(coverImage) ? coverImage : (images[0] ?? null);
    setMain(first);
    // galleryKey encodes image URLs + cover; avoids resetting when parent re-renders with same gallery.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryKey]);

  const openLightbox = useCallback((url: string) => {
    setLightbox(url);
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  if (!ordered.length) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-white/20 text-sm text-slate-500">
        No photos yet
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => main && openLightbox(main)}
          className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] text-left outline-none ring-premium-gold/40 focus-visible:ring-2"
          aria-label={`Enlarge photo — ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={main ?? ordered[0]}
            alt={title}
            className="aspect-[4/3] w-full object-cover sm:aspect-[16/10]"
          />
          <span className="sr-only">Open larger preview</span>
        </button>

        <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-x-visible">
          {ordered.map((src) => {
            const active = main === src;
            return (
              <li key={src} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setMain(src)}
                  className={[
                    "overflow-hidden rounded-lg border-2 transition",
                    active ? "border-premium-gold" : "border-transparent opacity-80 hover:opacity-100",
                  ].join(" ")}
                  aria-label="Show this photo"
                  aria-pressed={active}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-16 w-20 object-cover sm:h-20 sm:w-28" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
