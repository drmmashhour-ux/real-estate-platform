import type { ReactNode } from "react";

type Density = "compact" | "default" | "spacious";

const densityClass: Record<Density, string> = {
  compact: "py-8 sm:py-10",
  default: "py-12 sm:py-16",
  spacious: "py-16 sm:py-24",
};

/**
 * Vertical section spacing for marketing + dashboard surfaces.
 */
export function SectionWrapper({
  id,
  children,
  className = "",
  density = "default",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  density?: Density;
}) {
  return (
    <section id={id} className={[densityClass[density], className].join(" ")}>
      {children}
    </section>
  );
}
