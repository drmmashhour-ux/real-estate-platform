"use client";

import { useEffect, useRef, useState } from "react";
import { ListingInsuranceLeadSection } from "@/components/insurance/ListingInsuranceLeadSection";

const DELAY_MS = 8000;

/**
 * Reveal listing insurance capture after scroll-into-view OR a short delay (whichever first) to avoid immediate clutter.
 */
export function DeferredListingInsuranceLeadSection({ listingId }: { listingId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => setVisible(true);
    const timer = setTimeout(show, DELAY_MS);
    const el = ref.current;
    if (!el) {
      return () => clearTimeout(timer);
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) show();
      },
      { root: null, threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => {
      clearTimeout(timer);
      obs.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="min-h-[1px]">
      {visible ? (
        <ListingInsuranceLeadSection listingId={listingId} />
      ) : (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-8" aria-hidden>
          <div className="mx-auto max-w-4xl animate-pulse rounded-2xl border border-slate-800/80 bg-slate-900/30 py-16" />
        </div>
      )}
    </div>
  );
}
