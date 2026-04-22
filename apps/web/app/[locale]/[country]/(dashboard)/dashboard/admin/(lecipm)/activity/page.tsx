import Link from "next/link";

import { getRecentAdminActivity } from "@/modules/admin-intelligence";

export const dynamic = "force-dynamic";

export default async function AdminActivityDrillPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const items = await getRecentAdminActivity(40);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-white" style={{ background: "#030303" }}>
      <p className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/80">Operations</p>
      <h1 className="mt-3 font-serif text-3xl font-light">Activity stream</h1>
      <p className="mt-3 max-w-2xl text-sm text-zinc-500">
        Recent bookings, CRM leads, and paid platform touches — unified for situational awareness.
      </p>

      <ul className="mt-10 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-white/10 px-4 py-3"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">{item.kind}</span>
              <p className="text-sm text-white">{item.detail}</p>
            </div>
            <time className="text-xs text-zinc-600">
              {new Date(item.occurredAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </time>
          </li>
        ))}
      </ul>

      <Link href={adminBase} className="mt-10 inline-block text-sm text-[#D4AF37] hover:underline">
        ← Command center
      </Link>
    </div>
  );
}
