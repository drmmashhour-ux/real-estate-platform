import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AdminTaxHubPage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/admin/tax");
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/admin" className="text-sm hover:underline" style={{ color: GOLD }}>
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">Tax &amp; GST/QST summaries</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Internal accounting summaries only — not final tax filing software. Verify all filings with a qualified accountant.
        </p>

        <section className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-lg font-medium" style={{ color: GOLD }}>
            Platform GST/QST
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            JSON: <code className="text-xs text-slate-300">GET /api/tax/platform-summary?from=...&amp;to=...</code>
          </p>
          <p className="mt-2 text-sm text-slate-400">
            CSV:{" "}
            <a href="/api/tax/platform-summary?format=csv" className="underline" style={{ color: GOLD }}>
              Download sample CSV
            </a>
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-lg font-medium" style={{ color: GOLD }}>
            Broker tax summaries
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            JSON: <code className="text-xs text-slate-300">GET /api/tax/broker-summary?year=2026</code> (broker: own; admin
            can pass brokerId)
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-lg font-medium text-slate-200">
            Existing tax documents (Finance)
          </h2>
          <Link href="/admin/finance/tax" className="mt-2 inline-block text-sm hover:underline" style={{ color: GOLD }}>
            Finance → Tax documents →
          </Link>
        </section>

        <section className="mt-8 text-xs text-slate-500">
          <p>Revenue sources (BNHUB fees, FSBO, subscriptions, lead credits, mortgage) are aggregated from platform payments where available.</p>
        </section>
      </div>
    </main>
  );
}
