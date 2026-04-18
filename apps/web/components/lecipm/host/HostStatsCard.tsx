"use client";

export type HostStatsCardProps = {
  views: number;
  saves: number;
  inquiries: number;
  className?: string;
};

export function HostStatsCard({ views, saves, inquiries, className = "" }: HostStatsCardProps) {
  const items = [
    { label: "Views", value: views },
    { label: "Saves", value: saves },
    { label: "Inquiries", value: inquiries },
  ];
  return (
    <section
      className={`grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${className}`}
    >
      {items.map((x) => (
        <div key={x.label} className="text-center">
          <p className="text-2xl font-bold text-white">{x.value.toLocaleString("en-CA")}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{x.label}</p>
        </div>
      ))}
    </section>
  );
}
