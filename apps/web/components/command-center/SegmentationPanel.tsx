import Link from "next/link";

const RANGE_PRESETS = [
  { key: "7d" as const, span: 7 },
  { key: "30d" as const, span: 30 },
  { key: "90d" as const, span: 90 },
];

export function SegmentationPanel({
  days,
  city,
}: {
  days: number;
  city?: string;
}) {
  const q = (rangeKey: "7d" | "30d" | "90d") => {
    const p = new URLSearchParams();
    p.set("range", rangeKey);
    if (city?.trim()) p.set("city", city.trim());
    return `?${p.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ds-border bg-ds-surface/80 p-4">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-secondary">Window</span>
      {RANGE_PRESETS.map(({ key, span }) => (
        <Link
          key={key}
          href={q(key)}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            days === span
              ? "bg-ds-gold/15 text-ds-gold ring-1 ring-ds-gold/40"
              : "text-ds-text-secondary hover:bg-white/5"
          }`}
        >
          {span}d
        </Link>
      ))}
      <span className="ml-2 text-xs text-ds-text-secondary">
        Add <code className="text-ds-gold/80">?city=</code> to segment FSBO metrics
      </span>
    </div>
  );
}
