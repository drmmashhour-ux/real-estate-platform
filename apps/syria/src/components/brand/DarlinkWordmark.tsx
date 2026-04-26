import type { SVGProps } from "react";

export type DarlinkWordmarkVariant = "on-dark" | "on-light";

type Props = SVGProps<SVGSVGElement> & {
  variant?: DarlinkWordmarkVariant;
};

/**
 * Inline vector wordmark — uses Cairo / Inter from the document (next/font CSS vars).
 * Prefer this over `<img src="/brand/*.svg">` so Arabic renders with correct fonts.
 */
export function DarlinkWordmark({ variant = "on-dark", className, ...rest }: Props) {
  const onDark = variant === "on-dark";
  const strokeMain = onDark ? "#F8F6F2" : "#0F172A";
  const fillArStart = onDark ? "#FFFFFF" : "#0F172A";
  const fillArEnd = onDark ? "#e2e8f0" : "#334155";
  const fillEn = onDark ? "#FFFFFF" : "#0F172A";
  const fillTagStart = onDark ? "#D6C3A1" : "#a67c52";
  const fillTagEnd = onDark ? "#f5efe4" : "#D6C3A1";
  const sep = onDark ? "#FB7185" : "#C7353A";
  const stayDot = onDark ? "#FB7185" : "#C7353A";

  return (
    <svg
      viewBox="0 0 440 72"
      className={className}
      role="img"
      aria-label="Hadiah Link · هدية لينك"
      {...rest}
    >
      <defs>
        <linearGradient id="dw-ar" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillArStart} />
          <stop offset="100%" stopColor={fillArEnd} />
        </linearGradient>
        <linearGradient id="dw-tag" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fillTagStart} />
          <stop offset="100%" stopColor={fillTagEnd} />
        </linearGradient>
      </defs>

      <g transform="translate(0,10)" fill="none" stroke={strokeMain} strokeWidth={2.8} strokeLinejoin="round">
        <path d="M28 8 L46 24 V46 H10 V24 Z" />
        <path d="M28 46 V30 H34 V46" />
      </g>
      <g transform="translate(54,14)" stroke={strokeMain} strokeWidth={2.6} strokeLinecap="round" fill="none">
        <rect x="4" y="22" width="38" height="15" rx="4.5" />
        <path d="M11 22 Q23 10 35 22" />
        <circle cx="42" cy="6" r="5.5" fill={stayDot} stroke="none" />
      </g>

      <line x1="102" y1="6" x2="102" y2="62" stroke={sep} strokeWidth={2.6} strokeDasharray="4 8" strokeLinecap="round" />

      <text
        x="114"
        y="30"
        style={{
          fontFamily: "var(--font-darlink-cairo), Cairo, Noto Naskh Arabic, sans-serif",
          fontSize: 22,
          fontWeight: 700,
          fill: "url(#dw-ar)",
        }}
      >
        هدية لينك
      </text>
      <text
        x="114"
        y="54"
        style={{
          fontFamily: "var(--font-darlink-inter), Inter, system-ui, sans-serif",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          fill: fillEn,
        }}
      >
        Hadiah Link
      </text>
      <text
        x="114"
        y="70"
        style={{
          fontFamily: "var(--font-darlink-cairo), Cairo, sans-serif",
          fontSize: 11,
          fontWeight: 600,
          fill: "url(#dw-tag)",
        }}
      >
        بوابتك العقارية في سوريا
      </text>
    </svg>
  );
}
