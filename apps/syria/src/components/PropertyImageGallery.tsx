"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { useSyriaOffline } from "@/components/offline/SyriaOfflineProvider";

export function PropertyImageGallery({ images, title }: { images: string[]; title: string }) {
  const t = useTranslations("Listing");
  const { online } = useSyriaOffline();
  const [active, setActive] = useState(0);

  const displayImages = useMemo(() => {
    if (online || images.length === 0) return images;
    return images[0] ? [images[0]] : [];
  }, [images, online]);
  if (images.length === 0) {
    return (
      <div
        className="overflow-hidden rounded-[var(--darlink-radius-3xl)] border border-dashed border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)]/80 p-10 text-center shadow-none"
        role="img"
        aria-label={t("noImages")}
      >
        <p className="text-sm font-medium text-[color:var(--darlink-text-muted)]">{t("noImages")}</p>
      </div>
    );
  }

  const main = displayImages[active] ?? displayImages[0];

  return (
    <div className="space-y-3">
      {!online && images.length > 1 ? (
        <p className="rounded-xl border border-amber-200/70 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-950 [dir=rtl]:text-right">
          {t("offlinePhotosLimited")}
        </p>
      ) : null}
      {/* Mobile: horizontal swipe (scroll-snap) */}
      {displayImages.length > 1 ? (
        <div
          className="md:hidden"
          onScroll={(e) => {
            const el = e.currentTarget;
            const w = el.clientWidth;
            if (w <= 0) return;
            const i = Math.round(el.scrollLeft / w);
            if (i !== active && i >= 0 && i < displayImages.length) setActive(i);
          }}
        >
          <div
            className="flex w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: "touch" as const }}
          >
            {displayImages.map((src, i) => (
              <div
                key={`slide-${i}`}
                className="w-full min-w-full shrink-0 snap-center snap-always"
                aria-hidden={i !== active}
              >
                <div className="overflow-hidden rounded-[var(--darlink-radius-3xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)] shadow-none">
                  <div className="aspect-[16/10] w-full sm:aspect-[21/9]">
                    <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-1 text-center text-xs text-[color:var(--darlink-text-muted)]" aria-hidden>
            {active + 1} / {displayImages.length}
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          "overflow-hidden rounded-[var(--darlink-radius-3xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)] shadow-none",
          displayImages.length > 1 && "hidden md:block",
        )}
      >
        <div className="aspect-[16/10] w-full sm:aspect-[21/9]">
          <img src={main} alt="" className="h-full w-full object-cover" loading="eager" decoding="async" />
        </div>
      </div>

      {displayImages.length > 1 ? (
        <div className="hidden gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] md:flex">
          {displayImages.map((src, i) => (
            <button
              key={`thumb-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative size-16 min-h-[44px] min-w-[44px] shrink-0 overflow-hidden rounded-[var(--darlink-radius-lg)] border-2 sm:size-20",
                i === active
                  ? "border-[color:var(--darlink-accent)] ring-2 ring-[color:var(--darlink-accent)]/25"
                  : "border-transparent opacity-80 hover:opacity-100",
              )}
              aria-label={`${title} — ${i + 1}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
