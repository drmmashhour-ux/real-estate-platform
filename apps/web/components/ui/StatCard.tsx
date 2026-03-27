"use client";

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  sub,
  accent = "#1e3a8a",
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 ease-out hover:scale-[1.02] ${className}`}
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        borderColor: `${accent}30`,
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80" style={{ color: accent }}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}
