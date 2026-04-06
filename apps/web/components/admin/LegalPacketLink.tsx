import Link from "next/link";

type Props = {
  href: string;
  label?: string;
  className?: string;
};

export function LegalPacketLink({
  href,
  label = "Open legal packet",
  className = "rounded border border-sky-500/30 px-3 py-1.5 text-[11px] font-semibold text-sky-200 transition hover:bg-sky-500/10",
}: Props) {
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
