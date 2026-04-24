import Link from "next/link";

import { hubDefinitions } from "./hub-config";

export const dynamic = "force-dynamic";

export default async function AdminHubControlCenterPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;

  return (
    <div className="mx-auto max-w-5xl px-2 py-6 text-white">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/78">Hub control center</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">All marketplace hubs</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
        Jump into per-hub telemetry and operational drill-downs. Metrics below are placeholders until hub-level reporting is wired.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {hubDefinitions.map(({ slug, title }) => (
          <Link
            key={slug}
            href={`${adminBase}/hubs/${slug}`}
            className="rounded-[24px] border border-white/10 bg-[#0B0B0B] px-5 py-4 transition hover:border-[#D4AF37]/35"
          >
            <span className="text-lg font-medium text-white">{title}</span>
            <span className="mt-2 block text-sm text-[#D4AF37]">Open workspace →</span>
          </Link>
        ))}
      </div>

      <Link href={`${adminBase}`} className="mt-10 inline-block text-sm text-[#D4AF37] hover:underline">
        ← Command center home
      </Link>
    </div>
  );
}
