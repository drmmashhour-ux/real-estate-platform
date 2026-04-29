"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ListingImageSkeleton } from "@/components/syria/ListingImageSkeleton";
import { syriaListingThumbUrl } from "@/lib/syria/listing-image-thumb";

type Props = {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  /** Lite Mode: ~300px CDN thumb when URL supports transforms */
  thumbMaxWidth?: number;
};

/** Native img element with grey/blurred skeleton → fade-in (SYBNB-76). */
export function ListingFadeInImg({
  src,
  alt,
  className,
  loading = "lazy",
  fetchPriority,
  thumbMaxWidth,
}: Props) {
  const resolvedSrc =
    typeof thumbMaxWidth === "number" && thumbMaxWidth > 0 ? syriaListingThumbUrl(src, thumbMaxWidth) : src;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [resolvedSrc]);

  return (
    <span className="relative block h-full min-h-0 w-full min-w-0 overflow-hidden">
      <ListingImageSkeleton active={!loaded} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        onLoad={() => setLoaded(true)}
        className={cn(
          "relative z-[2] h-full w-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </span>
  );
}
