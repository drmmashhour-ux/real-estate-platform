import Link from "next/link";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

/**
 * Live broker monetization KPIs — paid CRM leads vs assigned, SaaS tier link.
 */
export async function BrokerHubMonetizationBanner(props: {
  locale: string;
  country: string;
}) {
  const userId = await getGuestId();
  if (!userId) return null;

  const broker = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (broker?.role !== "BROKER") return null;

  const base = `/${props.locale}/${props.country}`;

  const [paidAssigned, assignedTotal, closedWon, saas] = await Promise.all([
    prisma.brokerLead.count({
      where: { brokerId: userId, billingStatus: { in: ["paid", "waived"] } },
    }),
    prisma.brokerLead.count({ where: { brokerId: userId } }),
    prisma.brokerLead.count({
      where: { brokerId: userId, status: { in: ["closed"] } },
    }),
    prisma.brokerLecipmSubscription.findUnique({
      where: { userId },
      select: { planSlug: true, status: true },
    }),
  ]);

  const conversionPct =
    paidAssigned > 0 ? Math.round((closedWon / paidAssigned) * 1000) / 10 : null;

  return (
    <section className="border-b border-[#D4AF37]/20 bg-[#0a0a0a] px-6 py-4 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-white/85">
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <span>
            Leads purchased / assigned:{" "}
            <strong className="tabular-nums text-[#D4AF37]">{paidAssigned}</strong>
            {" / "}
            <strong className="tabular-nums">{assignedTotal}</strong>
          </span>
          <span>
            Closed (won): <strong className="tabular-nums">{closedWon}</strong>
          </span>
          <span>
            Conversion (closed ÷ paid):{" "}
            <strong className="tabular-nums">{conversionPct != null ? `${conversionPct}%` : "—"}</strong>
          </span>
          <span>
            Broker SaaS:{" "}
            <strong className="tabular-nums">
              {saas && ["active", "trialing"].includes(saas.status) ? saas.planSlug : "none"}
            </strong>
          </span>
        </div>
        <Link
          href={`${base}/broker/pricing`}
          className="rounded-full border border-[#D4AF37]/40 px-4 py-1.5 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          Plans & lead billing
        </Link>
      </div>
    </section>
  );
}
