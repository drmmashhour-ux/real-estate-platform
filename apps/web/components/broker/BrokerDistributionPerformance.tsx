import { prisma } from "@/lib/db";

function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function fmtCad(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/** FSBO listings owned by the broker — syndication analytics scope. */
export async function BrokerDistributionPerformance(props: {
  accent: string;
  brokerUserId: string;
}) {
  const { accent, brokerUserId } = props;

  const myListingIds = await prisma.fsboListing.findMany({
    where: { ownerId: brokerUserId },
    select: { id: true },
  });
  const ids = myListingIds.map((r) => r.id);

  if (ids.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-gold">Distribution Performance</p>
        <h2 className="mt-2 text-lg font-semibold text-white">Centris · LECIPM</h2>
        <p className="mt-2 text-sm text-slate-400">
          Publish FSBO listings from Sell Hub to see views, leads by channel, and estimated opportunity value here.
        </p>
      </section>
    );
  }

  const [
    totalViews,
    leadsCentris,
    leadsLecipmOrUnset,
    sumCentris,
    sumLecipm,
    totalLeadsAll,
  ] = await Promise.all([
    prisma.buyerListingView.count({ where: { fsboListingId: { in: ids } } }),
    prisma.lead.count({
      where: { fsboListingId: { in: ids }, distributionChannel: "CENTRIS" },
    }),
    prisma.lead.count({
      where: {
        fsboListingId: { in: ids },
        OR: [{ distributionChannel: "LECIPM" }, { distributionChannel: null }],
      },
    }),
    prisma.lead.aggregate({
      where: { fsboListingId: { in: ids }, distributionChannel: "CENTRIS" },
      _sum: { estimatedValue: true },
    }),
    prisma.lead.aggregate({
      where: {
        fsboListingId: { in: ids },
        OR: [{ distributionChannel: "LECIPM" }, { distributionChannel: null }],
      },
      _sum: { estimatedValue: true },
    }),
    prisma.lead.count({ where: { fsboListingId: { in: ids } } }),
  ]);

  const convPct = totalViews > 0 ? (totalLeadsAll / totalViews) * 100 : 0;
  const centrisVal = sumCentris._sum.estimatedValue ?? 0;
  const lecipmVal = sumLecipm._sum.estimatedValue ?? 0;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-gold">Distribution Performance</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Centris vs LECIPM</h2>
          <p className="mt-1 max-w-prose text-sm text-slate-400">
            Scoped to your Sell Hub FSBO listings. Attribution uses inquiry signals (e.g. qualified Centris traffic). No
            MLS scraping.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Total views</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white" style={{ color: accent }}>
            {totalViews.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">Buyer listing views</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Conversion</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{fmtPct(convPct)}</p>
          <p className="mt-1 text-xs text-slate-500">Leads ÷ views (all channels)</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Leads · Centris</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{leadsCentris}</p>
          <p className="mt-1 text-xs text-slate-500">Attributed inquiries</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Leads · LECIPM</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{leadsLecipmOrUnset}</p>
          <p className="mt-1 text-xs text-slate-500">Platform + legacy rows</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-medium text-white">Estimated opportunity · Centris</p>
          <p className="mt-1 text-lg font-semibold text-slate-200">{fmtCad(centrisVal)}</p>
          <p className="mt-1 text-xs text-slate-500">Sum of `estimatedValue` on attributed leads (CAD).</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-medium text-white">Estimated opportunity · LECIPM</p>
          <p className="mt-1 text-lg font-semibold text-slate-200">{fmtCad(lecipmVal)}</p>
          <p className="mt-1 text-xs text-slate-500">Sum of `estimatedValue` on platform-attributed leads (CAD).</p>
        </div>
      </div>
    </section>
  );
}
