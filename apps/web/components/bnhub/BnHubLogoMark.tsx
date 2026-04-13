import Image from "next/image";
import { BNHUB_LOGO_SRC } from "@/lib/brand/bnhub-logo";

const SIZE_CLASS = {
  xs: "h-6 sm:h-7",
  sm: "h-8 sm:h-9",
  md: "h-10 sm:h-11",
  lg: "h-12 sm:h-14",
  xl: "h-14 sm:h-16",
} as const;

export type BnHubLogoMarkSize = keyof typeof SIZE_CLASS;

type Props = {
  /** Defaults to full BNHUB lockup; use `BNHUB_MARK_SRC` for the compact header mark. */
  src?: string;
  size?: BnHubLogoMarkSize;
  className?: string;
  priority?: boolean;
  /** Pair with visible text (e.g. chip label) — image is ignored by screen readers. */
  decorative?: boolean;
};

/**
 * BNHUB lockup only (no tagline) — use anywhere the old “BNHUB” wordmark or grid icon appeared.
 */
export function BnHubLogoMark({
  src = BNHUB_LOGO_SRC,
  size = "md",
  className = "",
  priority = false,
  decorative = false,
}: Props) {
  return (
    <Image
      src={src}
      alt={decorative ? "" : "BNHUB"}
      width={280}
      height={80}
      unoptimized
      priority={priority}
      aria-hidden={decorative ? true : undefined}
      className={`w-auto max-w-[min(100%,280px)] object-contain object-left ${SIZE_CLASS[size]} ${className}`.trim()}
    />
  );
}
