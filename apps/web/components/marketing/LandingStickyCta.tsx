"use client";

import Link from "next/link";

/** Mobile-only sticky bar — desktop nav + in-page CTAs handle larger screens. */
export function LandingStickyCta() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D4AF37]/25 bg-black/95 px-4 py-3 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg gap-2">
        <Link
          href="/search"
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-[#D4AF37] px-4 text-sm font-semibold text-black"
        >
          Search properties
        </Link>
        <Link
          href="/list-your-property"
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border-2 border-[#D4AF37] px-4 text-sm font-semibold text-[#D4AF37]"
        >
          List property
        </Link>
      </div>
    </div>
  );
}
