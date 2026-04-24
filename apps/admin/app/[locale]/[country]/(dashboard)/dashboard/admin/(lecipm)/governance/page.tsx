import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminGovernancePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const risk = `${adminBase}/risk`;
  const topAutonomy = `/${locale}/${country}/admin/autonomy`;

  return (
    <div className="mx-auto max-w-3xl px-2 py-8 text-white">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/78">Risk & governance</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Governance oversight</h1>
      <p className="mt-4 text-sm leading-7 text-white/58">
        Policy breaches, trust graph signals, SLA risk, and human-in-the-loop checkpoints. Bridges LECIPM admin with deep autonomy tooling.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={risk}
          className="rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-medium text-black hover:brightness-110"
        >
          Risk & alerts
        </Link>
        <Link
          href={topAutonomy}
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/85 hover:border-[#D4AF37]/35"
        >
          Global autonomy (admin)
        </Link>
      </div>

      <Link href={`${adminBase}`} className="mt-12 block text-sm text-white/45 hover:text-[#D4AF37]">
        ← Command center home
      </Link>
    </div>
  );
}
