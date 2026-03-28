"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BRAND } from "@/config/branding";
import { PLATFORM_NAME, platformBrandGoldTextClass } from "@/lib/brand/platform";

const LOGO_DARK = "/branding/logo-dark.svg";
const LOGO_LIGHT = "/branding/logo-light.svg";
const LOGO_ICON = "/branding/logo-icon.svg";
const LOGO_PNG_FALLBACK = "/logo.png";

export type BrandLogoProps = {
  /** `default` — full wordmark for dark UI; `light` — for light backgrounds; `icon` — mark only. */
  variant?: "default" | "light" | "icon";
  className?: string;
  href?: string | null;
  priority?: boolean;
};

function LogoTextFallback({ className = "" }: { className?: string }) {
  return <span className={`font-bold tracking-[0.12em] text-white ${className}`.trim()}>LECIPM</span>;
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

  const w = variant === "icon" ? 40 : 220;
  const h = variant === "icon" ? 40 : 44;

  const inner =
    failed ? (
      <LogoTextFallback
        className={variant === "icon" ? "text-base sm:text-lg" : "text-xl sm:text-2xl"}
      />
    ) : (
      <Image
        src={src}
        alt={variant === "icon" ? `${BRAND.shortName} mark` : `${BRAND.shortName} logo`}
        width={w}
        height={h}
        className={
          variant === "icon"
            ? `h-9 w-9 shrink-0 object-contain drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] sm:h-10 sm:w-10 ${className}`.trim()
            : `h-8 w-auto max-w-[200px] object-contain object-left sm:h-9 ${className}`.trim()
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
  const [iconSrc, setIconSrc] = useState(LOGO_ICON);
  const [iconFailed, setIconFailed] = useState(false);

  if (variant === "nav") {
    return (
      <Link
        href="/"
        className={`group flex min-w-0 shrink-0 cursor-pointer items-center transition duration-200 hover:opacity-95 ${className}`}
        aria-label={`${PLATFORM_NAME} — Go to home`}
      >
        <span className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          {iconFailed ? (
            <LogoTextFallback className="text-lg sm:text-xl" />
          ) : (
            <Image
              src={iconSrc}
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] sm:h-10 sm:w-10"
              priority
              onError={() => {
                if (iconSrc !== LOGO_PNG_FALLBACK) {
                  setIconSrc(LOGO_PNG_FALLBACK);
                } else {
                  setIconFailed(true);
                }
              }}
            />
          )}
          {showName ? (
            <span
              className={`truncate font-semibold tracking-[0.14em] ${platformBrandGoldTextClass} text-lg sm:text-xl md:text-2xl`}
            >
              {PLATFORM_NAME}
            </span>
          ) : null}
        </span>
      </Link>
    );
  }

  return <BrandLogo variant="default" className={className} href="/" priority />;
}

export function LogoText() {
  return (
    <Link href="/" className="transition hover:opacity-80" aria-label="Go to home">
      <span className={`text-lg font-extrabold ${platformBrandGoldTextClass}`}>{PLATFORM_NAME}</span>
    </Link>
  );
}
