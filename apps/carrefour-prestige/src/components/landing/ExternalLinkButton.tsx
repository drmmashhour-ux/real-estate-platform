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
      ? "bg-[#C9A646] text-[#0B0B0B] shadow-[0_8px_32px_rgba(201,166,70,0.25)] hover:bg-[#b8943d]"
      : "border border-[#C9A646] text-[#C9A646] bg-transparent hover:bg-[#C9A646]/10";

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
