/**
 * Maple leaf (Canada) — official SVG from Wikimedia Commons (public domain).
 * @see https://commons.wikimedia.org/wiki/File:Flag_of_Canada_(Pantone).svg
 */
export function CanadaFlagIcon({ className = "h-5 w-7" }: { className?: string }) {
  return (
    <img
      src="/flags/canada.svg"
      alt=""
      className={`object-contain ${className}`}
      width={1200}
      height={600}
      loading="lazy"
      decoding="async"
      aria-hidden
    />
  );
}
