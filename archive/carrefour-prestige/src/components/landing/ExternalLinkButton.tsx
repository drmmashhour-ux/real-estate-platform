import Link from "next/link";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

/** Clearly marked external platform navigation (opens in new tab). */
export function ExternalLinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: Props) {
  const base =
    variant === "primary"
      ? "bg-[#D4AF37] text-[#0B0B0B] shadow-[0_8px_32px_rgba(212, 175, 55,0.25)] hover:bg-[#D4AF37]"
      : "border border-[#D4AF37] text-[#D4AF37] bg-transparent hover:bg-[#D4AF37]/10";

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-lg px-8 py-3.5 text-sm font-semibold tracking-wide transition ${base} ${className}`}
    >
      {children}
      <span className="ml-2 text-[10px] font-normal uppercase tracking-widest opacity-70">↗</span>
    </Link>
  );
}
