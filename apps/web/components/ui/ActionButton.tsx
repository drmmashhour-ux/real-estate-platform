"use client";

import Link from "next/link";

type ActionButtonProps = {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  accent?: string;
  className?: string;
};

export function ActionButton({
  href,
  onClick,
  children,
  variant = "primary",
  accent = "#C9A96E",
  className = "",
}: ActionButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold tracking-tight transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-0 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none";
  const primaryStyle = {
    background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 82%, white 18%) 100%)`,
    color: "#081018",
    boxShadow: `0 10px 30px color-mix(in srgb, ${accent} 35%, transparent)`,
  };
  const secondaryStyle = {
    border: `1px solid color-mix(in srgb, ${accent} 55%, transparent)`,
    color: accent,
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
  };

  const content = (
    <span
      className={base}
      style={variant === "primary" ? primaryStyle : secondaryStyle}
    >
      {children}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
