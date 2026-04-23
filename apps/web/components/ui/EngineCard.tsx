import Link from "next/link";

const colorClasses = {
  blue: "border-blue-500/35 hover:border-blue-400/60 bg-blue-500/[0.06]",
  green: "border-emerald-500/35 hover:border-emerald-400/60 bg-emerald-500/[0.06]",
  yellow: "border-amber-400/40 hover:border-amber-300/70 bg-amber-400/[0.06]",
  gold: "border-[#D4AF37]/45 hover:border-[#D4AF37]/80 bg-[#D4AF37]/[0.06]",
} as const;

export type EngineCardProps = {
  title: string;
  color: keyof typeof colorClasses;
  href: string;
  ctaLabel?: string;
};

export function EngineCard({ title, color, href, ctaLabel = "Start analysis" }: EngineCardProps) {
  return (
    <div className={`rounded-xl border p-4 transition ${colorClasses[color]}`}>
      <h3 className="font-medium text-[#D4AF37]">{title}</h3>
      <Link
        href={href}
        className="mt-3 inline-block rounded-lg bg-[#D4AF37] px-3 py-2 text-sm font-medium text-black hover:bg-[#c9a432]"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
