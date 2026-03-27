"use client";

import Image from "next/image";
import { useState } from "react";
import {
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_NAME,
  platformCarrefourGoldGradientClass,
} from "@/lib/brand/platform";

const HERO_ALT = `${PLATFORM_NAME} — ${PLATFORM_CARREFOUR_NAME}`;

const HERO_FULL = "/brand/lecipm-full-on-dark.svg";

/**
 * Hero: full premium lockup (mark + LECIPM + subtitle) for dark backgrounds.
 */
export function LogoCipmHero() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center rounded-2xl border-2 border-premium-gold/50 bg-[#121212] px-4 py-8 shadow-[0_0_40px_rgba(201,166,70,0.12)] sm:px-6 sm:py-10"
        role="img"
        aria-label={HERO_ALT}
      >
        <span className="font-serif text-4xl font-extrabold leading-none tracking-tight text-brand-gold drop-shadow-[0_2px_16px_rgba(201,166,70,0.35)] sm:text-5xl md:text-6xl lg:text-7xl">
          {PLATFORM_NAME}
        </span>
        <span
          className={`mt-3 max-w-xl text-center text-[10px] font-medium uppercase leading-snug tracking-[0.18em] sm:text-xs ${platformCarrefourGoldGradientClass}`}
        >
          {PLATFORM_CARREFOUR_NAME}
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[min(100%,40rem)] px-2 sm:max-w-[min(100%,44rem)] sm:px-4">
      <div className="relative mx-auto w-full aspect-[520/140] min-h-[5rem] max-h-[min(34vh,280px)] sm:min-h-[6.5rem] sm:max-h-[min(38vh,320px)] md:min-h-[7.5rem] lg:max-h-[min(42vh,360px)]">
        <Image
          src={HERO_FULL}
          alt={HERO_ALT}
          fill
          sizes="(max-width: 896px) 100vw, 704px"
          className="object-contain object-center drop-shadow-[0_8px_56px_rgba(201,166,70,0.42)]"
          priority
          onError={() => setFailed(true)}
        />
      </div>
    </div>
  );
}
