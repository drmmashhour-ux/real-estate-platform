"use client";

import Image from "next/image";

type BrandAssetPlaceholderProps = {
  title: string;
  subtitle: string;
  formatHint: string;
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
};

export function BrandAssetPlaceholder({
  title,
  subtitle,
  formatHint,
  imageSrc,
  imageAlt,
  className = "",
}: BrandAssetPlaceholderProps) {
  return (
    <div
      className={`rounded-3xl border border-dashed border-premium-gold/35 bg-[linear-gradient(180deg,rgba(212,175,55,0.08),rgba(255,255,255,0.02))] p-6 ${className}`.trim()}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Asset placeholder</p>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{subtitle}</p>
      <div className="mt-5 flex min-h-[160px] items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-6 text-center">
        {imageSrc ? (
          <div className="relative w-full overflow-hidden rounded-2xl">
            <Image
              src={imageSrc}
              alt={imageAlt ?? title}
              width={1200}
              height={900}
              className="h-auto w-full object-contain"
            />
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-white">Drop exported asset here</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{formatHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
