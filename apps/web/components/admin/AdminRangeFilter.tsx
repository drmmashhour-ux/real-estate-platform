import Link from "next/link";

type Props = {
  current: "7d" | "30d";
};

export function AdminRangeFilter({ current }: Props) {
  const base = "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors";
  const active = "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40";
  const idle = "bg-white/5 text-[#B3B3B3] hover:bg-white/10 hover:text-white";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-[#737373]">Range</span>
      <Link href="/dashboard/admin?range=7d" className={`${base} ${current === "7d" ? active : idle}`}>
        Last 7 days
      </Link>
      <Link href="/dashboard/admin?range=30d" className={`${base} ${current === "30d" ? active : idle}`}>
        Last 30 days
      </Link>
    </div>
  );
}
