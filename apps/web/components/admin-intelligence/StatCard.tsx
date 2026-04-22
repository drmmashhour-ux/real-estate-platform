"use client";

export function StatCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { label: string; positive?: boolean };
}) {
  return (
    <div
      className="rounded-2xl border px-5 py-4 backdrop-blur-sm transition hover:border-[#D4AF37]/40"
      style={{
        borderColor: "rgba(212, 175, 55, 0.22)",
        background: "linear-gradient(145deg, rgba(18,18,18,0.95) 0%, rgba(8,8,8,0.98) 100%)",
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-2 font-serif text-2xl font-medium tracking-tight text-white md:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-sm text-zinc-400">{hint}</p> : null}
      {trend ? (
        <p
          className="mt-2 text-xs font-medium"
          style={{ color: trend.positive === false ? "#f87171" : trend.positive === true ? "#86efac" : gold }}
        >
          {trend.label}
        </p>
      ) : null}
    </div>
  );
}
