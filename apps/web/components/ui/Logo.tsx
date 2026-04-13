"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BRAND } from "@/config/branding";
import { PLATFORM_NAME, platformBrandWordmarkClass } from "@/lib/brand/platform";

/** Vector wordmarks — strict identity colors in SVG source. */
const LOGO_DARK = "/branding/logo-dark.svg";
const LOGO_LIGHT = "/branding/logo-light.svg";
const LOGO_ICON = "/branding/logo-icon.svg";
const LOGO_PNG_FALLBACK = "/branding/lecipm-logo-gold.png";

export type BrandLogoProps = {
  /** `default` — full wordmark for dark UI; `light` — for light backgrounds; `icon` — mark only. */
  variant?: "default" | "light" | "icon";
  className?: string;
  href?: string | null;
  priority?: boolean;
};

function LogoTextFallback({ className = "" }: { className?: string }) {
  return (
    <span className={`${platformBrandWordmarkClass} ${className}`.trim()}>{PLATFORM_NAME}</span>
  );
}

/**
 * Production-ready brand mark — uses `/public/branding/*.svg` (vector); PNG fallback chain on error.
 */
export function BrandLogo({
  variant = "default",
  className = "",
  href = "/",
  priority = false,
}: BrandLogoProps) {
  const [src, setSrc] = useState(
    variant === "light" ? LOGO_LIGHT : variant === "icon" ? LOGO_ICON : LOGO_DARK,
  );
  const [failed, setFailed] = useState(false);

  const w = variant === "icon" ? 40 : 640;
  const h = variant === "icon" ? 40 : 160;

  const inner =
    failed ? (
      <LogoTextFallback
        className={variant === "icon" ? "!text-base sm:!text-lg" : "!text-xl sm:!text-2xl"}
      />
    ) : (
      <Image
        src={src}
        alt={variant === "icon" ? `${BRAND.shortName} mark` : `${BRAND.shortName} logo`}
        width={w}
        height={h}
        unoptimized
        className={
          variant === "icon"
            ? `h-9 w-9 shrink-0 object-contain drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] sm:h-10 sm:w-10 ${className}`.trim()
            : `h-10 w-auto max-w-[min(100%,min(100vw-5rem,480px))] object-contain object-left sm:h-11 ${className}`.trim()
        }
        priority={priority}
        onError={() => {
          if (variant === "light") {
            setFailed(true);
            return;
          }
          if (src !== LOGO_PNG_FALLBACK) {
            setSrc(LOGO_PNG_FALLBACK);
            return;
          }
          setFailed(true);
        }}
      />
    );

  if (href === null) {
    return <span className="inline-flex items-center">{inner}</span>;
  }

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center transition hover:opacity-95"
      aria-label={`${BRAND.shortName} — home`}
    >
      {inner}
    </Link>
  );
}

type LegacyLogoProps = {
  showName?: boolean;
  className?: string;
  /** Navbar: icon + gold wordmark. */
  variant?: "default" | "nav";
};

/** @deprecated Prefer `BrandLogo` — kept for hub headers, MvpNav, etc. */
export default function Logo({ showName = true, className = "", variant = "default" }: LegacyLogoProps) {
  if (variant === "nav") {
    if (!showName) {
      return <BrandLogo variant="icon" className={className} href="/" priority />;
    }
    return <BrandLogo variant="default" className={className} href="/" priority />;
  }

  return <BrandLogo variant="default" className={className} href="/" priority />;
}

export function LogoText() {
  return (
    <Link href="/" className="transition hover:opacity-90" aria-label="Go to home">
      <span className={`text-lg ${platformBrandWordmarkClass}`}>{PLATFORM_NAME}</span>
    </Link>
  );
}
