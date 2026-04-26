import type { SVGProps } from "react";

const RED = "#DC2626";
const GOLD = "#D4AF37";

export type HadiahLogoVariant = "on-dark" | "on-light";

type Props = SVGProps<SVGSVGElement> & {
  /** `on-dark`: for navy header. `on-light`: for cards, paper, or light footers. */
  variant?: HadiahLogoVariant;
};

/**
 * Hadiah Link — brand mark: gift + red ribbon + gold house.
 * Size only with `className` (e.g. `w-8 h-8`); viewBox defines scalable geometry.
 */
export function HadiahLogo({ className, variant = "on-dark", ...rest }: Props) {
  const onDark = variant === "on-dark";
  const boxFill = onDark ? "#0f172a" : "#f8fafc";
  const boxStroke = onDark ? "rgb(255 255 255 / 0.14)" : "rgb(15 23 42 / 0.14)";
  const lidLine = onDark ? "rgb(255 255 255 / 0.1)" : "rgb(15 23 42 / 0.08)";

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      {...rest}
    >
      <rect x="6" y="10" width="36" height="32" rx="4" fill={boxFill} stroke={boxStroke} strokeWidth="1" />
      <line x1="6" y1="18" x2="42" y2="18" stroke={lidLine} strokeWidth="1" />
      <rect x="21.5" y="10" width="5" height="32" fill={RED} />
      <rect x="6" y="25.5" width="36" height="5" fill={RED} />
      <path
        d="M24 19.2l-5.2 4.1v2.1h1.3v-1.3h2.6v1.3h2.2v-1.3h2.5v1.3h1.3v-2.1L24 19.2z"
        fill={GOLD}
      />
      <rect x="22.1" y="25.2" width="3.7" height="2.2" fill={GOLD} />
    </svg>
  );
}
