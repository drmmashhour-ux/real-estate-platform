import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { GlobalExpansionDashboardClient } from "@/modules/global-expansion/components/GlobalExpansionDashboardClient";
import { buildEntryStrategyPlan } from "@/modules/global/entry.engine";
import { evaluateRegulationSurface } from "@/modules/global/regulation.engine";
import { resolveMarketLocalizationProfile } from "@/modules/global/localization.engine";
import { listAllCountryConfigsForExpansion } from "@/modules/global-expansion/global-country.service";

export const metadata = {
  title: "Global markets | LECIPM",
};

export default async function GlobalDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/global");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (me?.role !== PlatformRole.ADMIN) {
    redirect("/dashboard/admin/command-center");
  }

  const countries = listAllCountryConfigsForExpansion();
  const sample = countries[0];
  const entry = sample ? buildEntryStrategyPlan(sample.countryCode) : null;
  const reg = sample ? evaluateRegulationSurface(sample.countryCode) : null;
  const loc = sample ? resolveMarketLocalizationProfile(sample.countryCode) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/90">LECIPM</p>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Global markets &amp; expansion</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Markets, performance proxies, and readiness in one place. Regulation and entry planning are
          operator-facing awareness — not legal advice. Localization uses the same country registry as routing.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/dashboard/admin/command-center" className="text-amber-400/90 hover:underline">
            ← Command center
          </Link>
          <Link href="/dashboard/expansion" className="text-zinc-400 hover:text-zinc-200 hover:underline">
            Multi-city expansion
          </Link>
        </div>
      </div>

      {entry && reg?.ok && loc && (
        <div className="mx-auto max-w-6xl border-b border-zinc-800/80 px-6 py-4 text-xs text-zinc-300">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Engines snapshot ({entry.countryCode})</p>
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3">
              <p className="text-[10px] uppercase text-zinc-500">Entry strategy</p>
              <p className="mt-1 text-zinc-200">{entry.strategySummary}</p>
              <p className="mt-2 text-zinc-500">{entry.feedback.reviewCadence}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3">
              <p className="text-[10px] uppercase text-zinc-500">Regulation surface</p>
              <p className="mt-1 text-zinc-200">{reg.view.disclaimer}</p>
              <p className="mt-2 text-zinc-500">{reg.rules.length} rules · {reg.constraints.length} base constraints</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3">
              <p className="text-[10px] uppercase text-zinc-500">Localization</p>
              <p className="mt-1 font-mono text-cyan-200/90">{loc.currency} — {loc.sampleMoneyFormatted}</p>
              <p className="mt-2 line-clamp-3 text-zinc-500">{loc.uxHints[0]}</p>
            </div>
          </div>
        </div>
      )}

      <GlobalExpansionDashboardClient adminBase="/dashboard" />
    </div>
  );
}
