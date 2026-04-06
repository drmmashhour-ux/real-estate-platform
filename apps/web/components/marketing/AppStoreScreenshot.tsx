import type { CSSProperties } from "react";
import Image from "next/image";

export type AppStoreScreenshotVariant = "default" | "dark" | "gold-accent";

export type AppStoreScreenshotProps = {
  title: string;
  subtitle: string;
  /** PNG or WebP under /public */
  image: string;
  variant?: AppStoreScreenshotVariant;
  /** When set, constrains layout for Playwright export (exact pixel canvas) */
  exportWidth?: number;
  exportHeight?: number;
  /** Optional id for automated capture */
  captureId?: string;
};

/**
 * Premium black / gold marketing frame: headline, subcopy, phone shell with artwork.
 * Artwork is typically 1290×2796; inside the phone frame we favor the upper mock area (object-top) for a clean hero.
 */
export function AppStoreScreenshot({
  title,
  subtitle,
  image,
  variant = "default",
  exportWidth,
  exportHeight,
  captureId = "lecipm-app-store-shot",
}: AppStoreScreenshotProps) {
  const isExport = exportWidth != null && exportHeight != null;
  const glowOpacity = variant === "gold-accent" ? 0.18 : variant === "dark" ? 0.06 : 0.12;

  const titleSize = isExport
    ? exportWidth <= 1100
      ? "text-[40px] leading-tight"
      : "text-[52px] leading-[1.08]"
    : "text-3xl sm:text-4xl md:text-5xl leading-tight";

  const subSize = isExport
    ? exportWidth <= 1100
      ? "text-[22px] leading-snug"
      : "text-[28px] leading-snug"
    : "text-base sm:text-lg md:text-xl";

  const padX = isExport ? Math.round(exportWidth * 0.065) : 24;
  const padTop = isExport ? Math.round(exportHeight * 0.055) : 32;
  const phonePad = isExport ? Math.round(exportHeight * 0.028) : 16;

  return (
    <div
      id={captureId}
      className="relative flex w-full flex-col bg-black text-white"
      style={
        isExport
          ? { width: exportWidth, height: exportHeight, minWidth: exportWidth, minHeight: exportHeight }
          : { minHeight: "100%" }
      }
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 55% at 50% 28%, rgba(212, 175, 55, ${glowOpacity}) 0%, transparent 58%)`,
        }}
        aria-hidden
      />
      <div
        className="relative z-[1] flex flex-1 flex-col"
        style={{ paddingLeft: padX, paddingRight: padX, paddingTop: padTop }}
      >
        <h2
          className={`text-center font-extrabold tracking-tight text-[#D4AF37] ${titleSize}`}
          style={{ textWrap: "balance" } as CSSProperties}
        >
          {title}
        </h2>
        <p
          className={`mt-3 text-center font-medium text-zinc-400 ${subSize}`}
          style={{ textWrap: "balance" } as CSSProperties}
        >
          {subtitle}
        </p>

        <div className="mt-6 flex flex-1 items-center justify-center pb-6 sm:mt-8 sm:pb-8" style={{ paddingLeft: phonePad, paddingRight: phonePad }}>
          <div
            className="relative w-full max-w-[min(92vw,420px)] overflow-hidden rounded-[2.25rem] border-2 border-[#D4AF37]/35 bg-[#0a0a0a] shadow-[0_0_60px_-12px_rgba(212,175,55,0.35)] sm:max-w-[min(88vw,480px)]"
            style={
              isExport
                ? {
                    aspectRatio: `${exportWidth} / ${Math.round(exportHeight * 0.52)}`,
                    maxHeight: Math.round(exportHeight * 0.52),
                  }
                : { aspectRatio: "9 / 19.2" }
            }
          >
            <Image
              src={image}
              alt=""
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 92vw, 480px"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
