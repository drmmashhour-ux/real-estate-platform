import Link from "next/link";
import type { DemoWalkthroughData } from "@/lib/demo/demo-walkthrough-data";

type Props = {
  data: DemoWalkthroughData;
  /** Show link to staging reset UI (admins). */
  showStagingTools?: boolean;
};

export function DemoWalkthroughPanel({ data, showStagingTools }: Props) {
  const {
    prestige,
    urban,
    pId,
    listingP,
    offerP,
    contractP,
    apptP,
    roomFolder,
    brokerUser,
    clientUser,
    intakeClient,
    finance,
  } = data;

  const link = (label: string, href: string, ok: boolean) => (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
      <span className="text-slate-200">{label}</span>
      {ok ? (
        <Link href={href} className="font-medium text-emerald-400 hover:text-emerald-300">
          Open →
        </Link>
      ) : (
        <span className="text-slate-500">Run demo seed first</span>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-slate-500">
          <Link href="/demos" className="font-medium text-emerald-400/90 hover:text-emerald-300">
            ← All demos &amp; tours
          </Link>
        </p>
        <h1 className="mt-3 text-xl font-semibold text-white">Demo walkthrough (Prestige story)</h1>
        <p className="mt-2 text-sm text-slate-400">
          Quick links after{" "}
          <code className="rounded bg-white/10 px-1">npm run demo:full</code> in{" "}
          <code className="rounded bg-white/10 px-1">apps/web</code> (
          <code className="rounded bg-white/10 px-1">DEMO_FULL_CLEAR=1</code> to replace).
        </p>
        {showStagingTools ? (
          <p className="mt-2 text-sm text-slate-500">
            Staging reset: <Link className="text-emerald-400 hover:underline" href="/admin/demo">/admin/demo</Link>
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Full admin map (same links):{" "}
            <Link className="text-emerald-400 hover:underline" href="/dashboard/admin/demo">
              /dashboard/admin/demo
            </Link>{" "}
            (requires admin).
          </p>
        )}
      </div>

      <section className="rounded-xl border border-white/10 bg-black/30 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Tenants</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <span className="text-slate-400">Prestige:</span> {prestige?.name ?? "—"}{" "}
            <span className="font-mono text-xs text-slate-600">(prestige-realty-demo)</span>
          </li>
          <li>
            <span className="text-slate-400">Urban:</span> {urban?.name ?? "—"}{" "}
            <span className="font-mono text-xs text-slate-600">(urban-property-advisors-demo)</span>
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-white">Primary scenario (David ↔ Michael · Luxury Condo)</h2>
        {link("Broker CRM overview", "/dashboard/broker/crm", !!pId)}
        {link("Broker CRM — Michael Chen", intakeClient ? `/dashboard/broker/clients/${intakeClient.id}` : "#", !!intakeClient)}
        {link("Listings (CRM)", "/dashboard/listings", !!listingP)}
        {link("Listing detail", listingP ? `/dashboard/listings/${listingP.id}` : "#", !!listingP)}
        {link("Offer inbox", "/dashboard/broker/offers", !!pId)}
        {link("Accepted offer (detail)", offerP ? `/dashboard/offers/${offerP.id}` : "#", !!offerP)}
        {link("Contracts", "/dashboard/contracts", !!pId)}
        {link("Signed contract", contractP ? `/dashboard/contracts/${contractP.id}` : "#", !!contractP)}
        {link("Deal room folder (storage)", "/dashboard/storage", !!roomFolder)}
        {link("Messages", "/dashboard/messages", !!pId)}
        {link("Intake (broker)", "/dashboard/broker/intake", !!pId)}
        {link("Appointments", apptP ? `/dashboard/appointments/${apptP.id}` : "/dashboard/appointments", !!pId)}
        {link("Tasks", "/dashboard/tasks", !!pId)}
        {link("Notifications", "/dashboard/notifications", !!pId)}
        {link("Deals pipeline", "/dashboard/deals", !!pId)}
        {link("Billing (platform usage)", "/dashboard/billing", true)}
        {link("Broker commissions", "/dashboard/broker/commissions", !!brokerUser)}
        {link("Tenant workspace", "/tenant", !!prestige)}
        {link("Platform analytics (admin)", "/dashboard/admin", true)}
      </section>

      <section className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-slate-500">
        <p>
          <span className="text-slate-400">Broker:</span> {brokerUser?.name} ·{" "}
          <span className="font-mono">{brokerUser?.email}</span>
        </p>
        <p className="mt-1">
          <span className="text-slate-400">Client:</span> {clientUser?.name} ·{" "}
          <span className="font-mono">{clientUser?.email}</span>
        </p>
        {listingP ? (
          <p className="mt-2 text-slate-400">
            Featured listing: {listingP.title} · {listingP.listingCode} · ${listingP.price.toLocaleString()} CAD
          </p>
        ) : null}
        {finance ? (
          <p className="mt-1 text-slate-400">
            Deal financial snapshot: sale $
            {finance.salePrice != null ? finance.salePrice.toLocaleString() : "—"} · commission (gross) $
            {finance.grossCommission?.toLocaleString() ?? "—"}
          </p>
        ) : null}
      </section>
    </div>
  );
}
