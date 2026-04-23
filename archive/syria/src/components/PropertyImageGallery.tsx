"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function PropertyImageGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return null;

  const main = images[active] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[var(--darlink-radius-3xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)] shadow-[var(--darlink-shadow-md)]">
        <div className="aspect-[16/10] w-full sm:aspect-[21/9]">
          <img src={main} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-[var(--darlink-radius-lg)] border-2 transition sm:size-20",
                i === active
                  ? "border-[color:var(--darlink-accent)] ring-2 ring-[color:var(--darlink-accent)]/25"
                  : "border-transparent opacity-80 hover:opacity-100",
              )}
              aria-label={`${title} — ${i + 1}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
