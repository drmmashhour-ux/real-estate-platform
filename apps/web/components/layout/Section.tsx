import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
  density = "default",
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  density?: "compact" | "default" | "relaxed";
}) {
  const y = density === "compact" ? "py-8 md:py-10" : density === "relaxed" ? "py-16 md:py-24" : "py-10 md:py-14";
  return (
    <section id={id} className={[y, className].join(" ")}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ds-gold">{eyebrow}</p>
      ) : null}
      {title ? <h2 className="mt-2 font-[family-name:var(--font-serif)] text-2xl font-semibold text-ds-text sm:text-3xl">{title}</h2> : null}
      {subtitle ? <p className="mt-3 max-w-2xl text-sm text-ds-text-secondary sm:text-base">{subtitle}</p> : null}
      <div className={title || subtitle || eyebrow ? "mt-8" : ""}>{children}</div>
    </section>
  );
}
