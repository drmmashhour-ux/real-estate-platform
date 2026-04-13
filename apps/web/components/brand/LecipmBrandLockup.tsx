"use client";

import Link from "next/link";
import { BrandLogo, type BrandLogoProps } from "@/components/ui/Logo";
import { PLATFORM_CARREFOUR_NAME } from "@/lib/brand/platform";
import { BRAND } from "@/config/branding";

export type LecipmBrandLockupProps = {
  /** Destination when the lockup is clicked; `null` = no link (logo only, e.g. wrapped by parent). */
  href?: string | null;
  variant?: "dark" | "light";
  /** Tighter logo + slogan for toolbars and hub headers. */
  density?: "default" | "compact";
  align?: "start" | "center";
  logoVariant?: BrandLogoProps["variant"];
  className?: string;
  logoClassName?: string;
  /** Override default slogan colors (e.g. footer gold). */
  sloganClassName?: string;
  priority?: boolean;
  /**
   * Extra line under the mark (`Le Carrefour Immobilier Prestige`). Default `false` — vector/PNG lockups already include it; showing both looks duplicated.
   */
  showSlogan?: boolean;
};

/**
 * Canonical LECIPM mark — logo asset by default without a second text line (avoids duplicating copy baked into the artwork).
 */
export function LecipmBrandLockup({
  href = "/",
  variant = "dark",
  density = "default",
  align = "start",
  logoVariant = "default",
  className = "",
  logoClassName = "",
  sloganClassName,
  priority = false,
  showSlogan = false,
}: LecipmBrandLockupProps) {
  const defaultSlogan =
    variant === "dark"
      ? density === "compact"
        ? "text-[9px] font-medium leading-snug text-neutral-400 sm:text-[10px]"
        : "text-[10px] font-medium leading-snug text-neutral-400 sm:text-[11px]"
      : density === "compact"
        ? "text-[9px] font-medium leading-snug text-slate-600 sm:text-[10px]"
        : "text-[10px] font-medium leading-snug text-slate-600 sm:text-[11px]";

  const sloganCls = sloganClassName ?? defaultSlogan;
  const alignCls = align === "center" ? "items-center text-center" : "items-start text-left";
  const gapCls = density === "compact" ? "gap-0" : "gap-0.5";

  const inner = (
    <>
      <BrandLogo variant={logoVariant} href={null} priority={priority} className={logoClassName} />
      {showSlogan ? (
        <span className={`block max-w-[min(100%,22rem)] ${sloganCls}`.trim()}>{PLATFORM_CARREFOUR_NAME}</span>
      ) : null}
    </>
  );

  const boxClass = `flex min-w-0 flex-col ${alignCls} ${gapCls} ${className}`.trim();

  if (href === null) {
    return (
      <span className={boxClass} aria-label={`${BRAND.shortName} · ${PLATFORM_CARREFOUR_NAME}`}>
        {inner}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${boxClass} transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-premium-gold/60`}
      aria-label={`${BRAND.shortName} — ${PLATFORM_CARREFOUR_NAME} — home`}
    >
      {inner}
    </Link>
  );
}
