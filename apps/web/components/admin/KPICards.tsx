import Link from "next/link";

export type KPICardItem = {
  label: string;
  value: string;
  /** When set, the whole card navigates (e.g. Bookings → review list). */
  href?: string;
};

type Props = {
  /** Live metrics only — parent supplies computed strings (e.g. $0.00 when empty). */
  items: KPICardItem[];
};

const cardClassName =
  "relative rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 shadow-lg transition hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]";

/**
 * Premium black + gold KPI strip for admin dashboards.
 */
export function KPICards({ items }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((it) => {
        const inner = (
          <>
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />
            <div className="text-sm text-white/60">{it.label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-white">{it.value}</div>
          </>
        );
        if (it.href) {
          return (
            <Link
              key={it.label}
              href={it.href}
              prefetch={false}
              className={`${cardClassName} block cursor-pointer no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50`}
            >
              {inner}
            </Link>
          );
        }
        return (
          <div key={it.label} className={cardClassName}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
