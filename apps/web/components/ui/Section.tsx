import type { ReactNode } from "react";

/**
 * Page section with optional title — uses brand spacing rhythm.
 */
export function Section({
  id,
  title,
  subtitle,
  eyebrow,
  children,
  className = "",
}: {
  id?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={["py-10 md:py-16", className].join(" ")}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A646]">{eyebrow}</p>
        ) : null}
        {title ? (
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
        ) : null}
        {subtitle ? <p className="mt-3 max-w-2xl text-base text-slate-400 sm:text-lg">{subtitle}</p> : null}
        <div className={title || subtitle || eyebrow ? "mt-8" : ""}>{children}</div>
      </div>
    </section>
  );
}
