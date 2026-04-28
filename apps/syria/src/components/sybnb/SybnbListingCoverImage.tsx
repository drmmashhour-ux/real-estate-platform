"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ListingImageSkeleton } from "@/components/syria/ListingImageSkeleton";

/** SYBNB grid card hero — lazy load + skeleton (SYBNB-76). */
export function SybnbListingCoverImage({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <ListingImageSkeleton active={!loaded} className="bg-neutral-200/90 ring-neutral-300/40" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          "relative z-[2] h-full w-full object-cover transition-opacity duration-300 group-hover:scale-[1.02]",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
