import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildDealSummary, listCommitteeQueueDeals } from "@/modules/deals/deal.service";

export const dynamic = "force-dynamic";

export default async function CommitteeQueuePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard/deals`;

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "ADMIN" && user.role !== "INVESTOR" && user.role !== "BROKER")) {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const queued = await listCommitteeQueueDeals();
  const enriched = await Promise.all(
    queued.map(async (d) => {
      const s = await buildDealSummary(d.id);
      return { deal: d, summary: s };
    })
  );

  return (
    <div className="space-y-4 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Committee queue</h1>
        <Link className="text-primary underline" href={base}>
          All deals
        </Link>
      </div>

      <ul className="space-y-3">
        {enriched.map(({ deal: d, summary }) => (
          <li key={d.id} className="rounded border p-3">
            <div className="flex flex-wrap justify-between gap-2">
              <Link className="font-mono text-primary underline" href={`${base}/${d.id}`}>
                {d.dealNumber}
              </Link>
              <span className="text-xs text-muted-foreground">{d.updatedAt.toISOString().slice(0, 16)}</span>
            </div>
            <p className="font-medium">{d.title}</p>
            <p className="text-xs text-muted-foreground">
              {d.committeeSubmissions[0]?.summary?.slice(0, 240) ?? "—"}
            </p>
            {summary ?
              <>
                <p className="mt-1 text-xs">
                  Readiness: {summary.readinessLabel} · Blockers: {summary.blockers.join("; ") || "none"}
                </p>
              </>
            : null}
          </li>
        ))}
      </ul>

      {enriched.length === 0 ?
        <p className="text-muted-foreground">No deals in committee review.</p>
      : null}
    </div>
  );
}
