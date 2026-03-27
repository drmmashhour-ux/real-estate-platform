import Link from "next/link";

type LuxuryActionButtonProps = {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  accent?: string;
  className?: string;
};

export function LuxuryActionButton({
  href,
  onClick,
  children,
  variant = "primary",
  accent = "#C9A96E",
  className = "",
}: LuxuryActionButtonProps) {
  const base = "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors";
  const primaryStyle = { backgroundColor: accent, color: "#000" };
  const secondaryStyle = { border: `1px solid ${accent}80`, color: accent };

  const content = (
    <span className={base} style={variant === "primary" ? primaryStyle : secondaryStyle}>
      {children}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={`hover:opacity-90 ${className}`}>
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
