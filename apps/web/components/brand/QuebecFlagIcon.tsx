/**
 * Fleurdelisé (Québec) — official SVG from Wikimedia Commons (public domain).
 * @see https://commons.wikimedia.org/wiki/File:Flag_of_Quebec.svg
 */
export function QuebecFlagIcon({ className = "h-5 w-7" }: { className?: string }) {
  return (
    <img
      src="/flags/quebec.svg"
      alt=""
      className={`object-contain ${className}`}
      width={900}
      height={600}
      loading="lazy"
      decoding="async"
      aria-hidden
    />
  );
}
