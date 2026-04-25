import type { ReactNode } from "react";

export type SectionTone = "default" | "premium";

/**
 * Page section with optional title — brand spacing; `premium` uses LECIPM DS typography + optional fade.
 */
export function Section({
  id,
  title,
  subtitle,
  eyebrow,
  children,
  className = "",
  containerClassName = "",
  tone = "default",
  enter = false,
}: {
  id?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  /** Wrap content width / horizontal padding (default: max-w-6xl) */
  containerClassName?: string;
  tone?: SectionTone;
  /** Adds `lp-fade` (respects `prefers-reduced-motion`) */
  enter?: boolean;
}) {
  const isPrem = tone === "premium";
  return (
    <section id={id} className={["py-10 md:py-16", enter ? "lp-fade" : "", className].filter(Boolean).join(" ")}>
      <div
        className={[
          "mx-auto px-4 sm:px-6",
          isPrem ? "max-w-5xl" : "max-w-6xl",
          containerClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {eyebrow ? (
          <p
            className={[
              "text-xs font-semibold uppercase tracking-[0.2em]",
              isPrem ? "text-ds-gold" : "text-premium-gold",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {eyebrow}
          </p>
        ) : null}
        {title ?
          <h2
            className={[
              "mt-2 tracking-tight",
              isPrem ? "font-sans text-3xl font-bold text-ds-text sm:text-4xl" : "font-serif text-3xl font-semibold text-white sm:text-4xl",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {title}
          </h2>
        : null}
        {subtitle ?
          <p
            className={[
              "mt-3 max-w-2xl sm:text-lg",
              isPrem ? "text-base leading-relaxed text-ds-text-secondary" : "text-base text-slate-400",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {subtitle}
          </p>
        : null}
        <div className={title || subtitle || eyebrow ? "mt-8" : ""}>{children}</div>
      </div>
    </section>
  );
}
