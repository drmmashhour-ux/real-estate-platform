import Link from "next/link";
import { redirect } from "next/navigation";
import { InvestorAssistantPanel } from "@/components/investor-hub/InvestorAssistantPanel";
import { InvestorPitchPanel } from "@/components/investor-hub/InvestorPitchPanel";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { loadAdminInvestorHubData } from "@/lib/investor/load-admin-investor-hub";
import { assessInvestorReadiness } from "@/modules/investor/pitch-format";
import {
  buildPitchDeckFromContext,
  loadPitchDeckContextFull,
} from "@/modules/investor/pitch-generator.service";

export const dynamic = "force-dynamic";

const CARDS: { href: string; title: string; desc: string }[] = [
  { href: "/admin/investor/pitch", title: "Pitch", desc: "Slide-by-slide deck viewer" },
  { href: "/admin/investor/metrics", title: "Metrics", desc: "Growth, funnel, charts, exports" },
  { href: "/admin/investor/financials", title: "Financials", desc: "Revenue, projections, assumptions" },
  { href: "/admin/investor/qa", title: "Q&A", desc: "Diligence questions & answers" },
  { href: "/admin/investor/simulation", title: "Live simulation", desc: "Practice meetings with AI scoring" },
];

export default async function AdminInvestorHomePage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  const data = await loadAdminInvestorHubData();
  const d = data.display;

  return (
    <main>
      <section className="border-b border-amber-900/30 bg-gradient-to-b from-zinc-950 to-black">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-500">Investor command center</p>
          <h1 className="mt-3 font-serif text-3xl text-amber-100 md:text-4xl">Founder · investor readiness</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Pitch, metrics, financials, structured Q&amp;A, and live meeting simulation — admin-only. Gold accents mark
            investor-grade surfaces.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href="/admin" className="text-amber-400/90 hover:text-amber-300">
              ← Admin home
            </Link>
            <Link prefetch={false} href="/api/admin/investor-metrics/export?format=pdf" className="text-zinc-500 hover:text-amber-200/90">
              Export PDF report
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-amber-500/20 bg-zinc-950/80 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Users</p>
            <p className="mt-1 text-2xl font-semibold text-amber-200">{d.totalUsers}</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-zinc-950/80 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Active (30d)</p>
            <p className="mt-1 text-2xl font-semibold text-amber-200">{d.activeUsers}</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-zinc-950/80 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Bookings (30d)</p>
            <p className="mt-1 text-2xl font-semibold text-amber-200">{d.bookings}</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-zinc-950/80 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Revenue (30d)</p>
            <p className="mt-1 text-2xl font-semibold text-amber-200">{d.revenue.toFixed(0)}</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-zinc-950/80 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Conversion</p>
            <p className="mt-1 text-2xl font-semibold text-amber-200">{(d.conversionRate * 100).toFixed(1)}%</p>
          </div>
        </div>

        <section className="rounded-2xl border border-amber-500/20 bg-zinc-950/40 p-6">
          <InvestorPitchPanel decks={decks} readiness={readiness} risks={risks} />
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-serif text-lg text-amber-200/90">Navigate</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {CARDS.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="block rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-amber-500/40 hover:bg-zinc-900/80"
                  >
                    <p className="font-medium text-amber-100/90">{c.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{c.desc}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <InvestorAssistantPanel />
        </div>
      </div>

    </main>
  );
}
