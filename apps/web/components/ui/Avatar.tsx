import type { ImgHTMLAttributes } from "react";

export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  className = "",
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "width" | "height"> & {
  fallback?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  if (!src && fallback) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`inline-flex items-center justify-center rounded-full bg-[#151515] font-semibold text-[#D4AF37] ring-2 ring-[#D4AF37]/25 ${dim} ${className}`.trim()}
      >
        {fallback.slice(0, 2)}
      </span>
    );
  }
  return (
    <span className={`inline-block overflow-hidden rounded-full ring-2 ring-black/10 ${dim} ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
    </span>
  );
}
