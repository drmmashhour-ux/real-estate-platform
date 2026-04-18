"use client";

/**
 * Skip navigation — visible only on keyboard focus (WCAG 2.4.1).
 * Place as the first focusable content inside the page landmark.
 */
export function SkipLinks({
  links,
  className = "",
}: {
  /** When omitted (e.g. root layout), render nothing — callers may pass explicit skip targets. */
  links?: readonly { href: string; label: string }[] | null;
  className?: string;
}) {
  const items = links ?? [];
  return (
    <div className={["lecipm-skip-links", className].filter(Boolean).join(" ")}>
      {items.map((l) => (
        <a key={l.href} href={l.href} className="lecipm-skip-link">
          {l.label}
        </a>
      ))}
    </div>
  );
}
