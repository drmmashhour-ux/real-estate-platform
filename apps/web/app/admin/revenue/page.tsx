import Link from "next/link";
import { redirect } from "next/navigation";
import { PaymentStatus, PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { BROKER_CREDIT_OFFERS } from "@/modules/revenue/broker-credits.config";

export const dynamic = "force-dynamic";

const LECIPM_EXPORT_PAYMENT = "broker_export_credits";

function cad(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function maskEmail(email: string) {
  const [a, d] = email.split("@");
  if (!d) return "—";
  return `${a.slice(0, 2)}…@${d}`;
}

export default async function AdminLecipmRevenuePage() {
  const guestId = await getGuestId();
  if (!guestId) redirect("/auth/login?next=/admin/revenue");
  if (!(await isPlatformAdmin(guestId))) redirect("/");

  const distinctDraftUsers = await prisma.turboDraft.findMany({
    where: { userId: { not: null } },
    select: { userId: true },
    distinct: ["userId"],
  });
  const draftUserIds = distinctDraftUsers.map((r) => r.userId).filter((x): x is string => Boolean(x));

  const [lecipmPaidAgg, payingPayers, creditWallets, brokerWithDraftCount, bnhubPaidAgg] = await Promise.all([
    prisma.platformPayment.aggregate({
      where: { paymentType: LECIPM_EXPORT_PAYMENT, status: "paid" },
      _sum: { amountCents: true },
    }),
    prisma.platformPayment.findMany({
      where: { paymentType: LECIPM_EXPORT_PAYMENT, status: "paid" },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.usageCredit.findMany({
      where: { credits: { gt: 0 } },
      take: 40,
      orderBy: { updatedAt: "desc" },
      select: {
        credits: true,
        updatedAt: true,
        user: { select: { id: true, email: true, role: true, brokerStatus: true } },
      },
    }),
    draftUserIds.length
      ? prisma.user.count({
          where: {
            role: PlatformRole.BROKER,
            id: { in: draftUserIds },
          },
        })
      : Promise.resolve(0),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.COMPLETED },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
  ]);

  const totalLecipmCents = lecipmPaidAgg._sum.amountCents ?? 0;
  const payingUsers = payingPayers.length;
  const avgRevenuePerUserCents = payingUsers > 0 ? Math.round(totalLecipmCents / payingUsers) : 0;
  const conversionRate =
    brokerWithDraftCount > 0 ? Math.min(100, (payingUsers / brokerWithDraftCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Admin · LECIPM</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">First Revenue Engine</h1>
          <p className="max-w-2xl text-sm text-zinc-400">
            Monétisation rapide côté courtiers : crédits d’export turbo-draft, Stripe Checkout, et suivi dans{" "}
            <code className="text-zinc-300">PlatformPayment</code> + <code className="text-zinc-300">UsageCredit</code>.
          </p>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90">
            <span className="font-medium text-amber-200">Ciblage / Stratégie :</span> courtiers issus du pipeline
            d’onboarding — pousser l’offre après la première utilisation réelle (premier dossier turbo-draft prêt).
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/admin/revenue-dashboard" className="text-amber-400 hover:text-amber-300">
              BNHub revenue dashboard →
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total revenue (exports)" value={cad(totalLecipmCents)} hint="Paid `broker_export_credits`" />
          <MetricCard label="Paying users" value={String(payingUsers)} hint="Distinct buyers" />
          <MetricCard label="Avg revenue / user" value={cad(avgRevenuePerUserCents)} hint="Among paying users" />
          <MetricCard
            label="Conversion (brokers)"
            value={`${conversionRate.toFixed(1)}%`}
            hint="Paying ÷ brokers avec ≥1 brouillon"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Offres</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="font-medium text-white">Offre A — Paiement à la pièce</p>
                <p className="mt-1 text-zinc-400">{cad(BROKER_CREDIT_OFFERS.A.priceCents)} → 1 export PDF</p>
              </li>
              <li className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="font-medium text-white">Offre B — Pack courtier (tôt)</p>
                <p className="mt-1 text-zinc-400">{cad(BROKER_CREDIT_OFFERS.B.priceCents)} → 10 exports</p>
              </li>
              <li className="rounded-xl border border-zinc-700/60 bg-zinc-900/40 p-4">
                <p className="font-medium text-zinc-200">Offre C — Courtier fondateur (optionnel)</p>
                <p className="mt-1 text-zinc-500">Gratuit + remise future — accord manuel / ops.</p>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Script court (vente)</h2>
            <blockquote className="mt-4 border-l-2 border-amber-500/50 pl-4 text-sm leading-relaxed text-zinc-300">
              Tu peux commencer sans engagement.
              <br />
              Tu paies seulement quand tu l’utilises.
              <br />
              Si ça ne t’aide pas, tu arrêtes.
            </blockquote>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Brokers actifs (solde crédits)</h2>
          <p className="mt-1 text-xs text-zinc-500">Derniers portefeuilles avec crédits &gt; 0</p>
          <ul className="mt-4 divide-y divide-zinc-800">
            {creditWallets.length === 0 ? (
              <li className="py-6 text-sm text-zinc-500">Aucun solde pour l’instant.</li>
            ) : (
              creditWallets.map((w) => (
                <li key={w.user.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span className="font-mono text-xs text-zinc-400">{maskEmail(w.user.email)}</span>
                  <span className="text-xs text-zinc-500">{w.user.role}</span>
                  <span className="tabular-nums text-emerald-400">{w.credits} cr.</span>
                  <span className="text-xs text-zinc-600">{w.updatedAt.toISOString().slice(0, 10)}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Suivi revenus (LECIPM)</h2>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{cad(totalLecipmCents)}</p>
            <p className="mt-1 text-sm text-zinc-400">
              Source : <code className="text-zinc-300">platform_payments</code> où{" "}
              <code className="text-zinc-300">payment_type = broker_export_credits</code> et statut payé.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Conversions (indicateur)</h2>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-amber-300">{conversionRate.toFixed(1)}%</p>
            <p className="mt-1 text-sm text-zinc-400">
              {payingUsers} payants / {brokerWithDraftCount} courtiers ayant au moins un brouillon turbo enregistré.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">BNHub (référence)</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Paiements séjours complétés :{" "}
            <span className="tabular-nums text-zinc-200">{bnhubPaidAgg._count._all}</span> · volume{" "}
            <span className="tabular-nums text-zinc-200">{cad(bnhubPaidAgg._sum.amountCents ?? 0)}</span>
          </p>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
