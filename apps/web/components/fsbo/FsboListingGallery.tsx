"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck } from "lucide-react";

type Props = {
  images: string[];
  coverImage?: string | null;
  title: string;
  /** Show a subtle “Verified listing” chip on the hero image */
  verifiedListing?: boolean;
};

export function FsboListingGallery({ images, coverImage, title, verifiedListing }: Props) {
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
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const first =
      coverImage && images.includes(coverImage) ? coverImage : (images[0] ?? null);
    setMain(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryKey]);

  const mainIndex = useMemo(() => {
    const m = main ?? ordered[0];
    const i = ordered.indexOf(m ?? "");
    return i >= 0 ? i : 0;
  }, [main, ordered]);

  const goDelta = useCallback(
    (delta: number) => {
      if (ordered.length < 2) return;
      const next = (mainIndex + delta + ordered.length) % ordered.length;
      setMain(ordered[next] ?? null);
    },
    [mainIndex, ordered]
  );

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
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#111] text-sm text-slate-500 sm:aspect-[16/10]">
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
          onTouchStart={(e) => {
            touchStartX.current = e.changedTouches[0]?.screenX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current;
            touchStartX.current = null;
            if (start == null || ordered.length < 2) return;
            const end = e.changedTouches[0]?.screenX;
            if (end == null) return;
            const dx = end - start;
            if (dx > 56) goDelta(-1);
            else if (dx < -56) goDelta(1);
          }}
          className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#141414] text-left outline-none ring-[#D4AF37]/30 focus-visible:ring-2"
          aria-label={`Enlarge photo — ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={main ?? ordered[0]}
            alt={title}
            decoding="async"
            fetchPriority="high"
            loading="eager"
            className="aspect-[4/3] w-full object-cover sm:aspect-[16/10]"
          />
          {verifiedListing ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/35 bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#E8D589] backdrop-blur-sm">
              <BadgeCheck className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden />
              Verified listing
            </span>
          ) : null}
          {ordered.length > 1 ? (
            <span className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
              {mainIndex + 1} / {ordered.length}
            </span>
          ) : null}
          <span className="sr-only">Open larger preview. Swipe sideways to change photos.</span>
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
                    "overflow-hidden rounded-xl border-2 transition",
                    active ? "border-[#D4AF37]" : "border-transparent opacity-80 hover:opacity-100",
                  ].join(" ")}
                  aria-label="Show this photo"
                  aria-pressed={active}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-16 w-20 object-cover sm:h-20 sm:w-28"
                  />
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
