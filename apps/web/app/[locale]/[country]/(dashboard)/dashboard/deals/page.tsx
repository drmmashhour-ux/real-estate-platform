import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { listPipelineDeals } from "@/modules/deals/deal.service";
import { StrategyInsightsDashboard } from "@/components/strategy/StrategyInsightsDashboard";

export const dynamic = "force-dynamic";

export default async function PipelineDealsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, country } = await params;
  const sp = await searchParams;

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const scopeBrokerId = user.role === "ADMIN" ? undefined : userId;
  const deals = await listPipelineDeals({
    scopeBrokerId,
    stage: typeof sp.stage === "string" ? sp.stage : undefined,
    decisionStatus: typeof sp.decision === "string" ? sp.decision : undefined,
    priority: typeof sp.priority === "string" ? sp.priority : undefined,
    dealNumberPrefix: typeof sp.dealNumber === "string" ? sp.dealNumber : undefined,
    transactionNumber: typeof sp.transactionNumber === "string" ? sp.transactionNumber : undefined,
    brokerId: typeof sp.owner === "string" ? sp.owner : undefined,
  });

  const base = `/${locale}/${country}/dashboard/deals`;

  return (
    <div className="space-y-4 p-4 text-sm">
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-slate-200">
        <StrategyInsightsDashboard compact className="text-slate-200" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Deal pipeline</h1>
        <Link className="text-primary underline" href={`${base}/committee`}>
          Committee queue
        </Link>
      </div>

      <p className="text-muted-foreground">
        Pipeline deals use <span className="font-mono">LEC-DEAL-YYYY-######</span> (distinct from CRM sale{" "}
        <code>Deal</code>).
      </p>

      <div className="overflow-x-auto rounded border">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2">Deal #</th>
              <th className="p-2">Title</th>
              <th className="p-2">Stage</th>
              <th className="p-2">Decision</th>
              <th className="p-2">Tx #</th>
              <th className="p-2">Priority</th>
              <th className="p-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="p-2 font-mono">
                  <Link className="text-primary underline" href={`${base}/${d.id}`}>
                    {d.dealNumber}
                  </Link>
                </td>
                <td className="p-2">{d.title}</td>
                <td className="p-2">{d.pipelineStage}</td>
                <td className="p-2">{d.decisionStatus}</td>
                <td className="p-2 font-mono">{d.latestTransactionNumber ?? "—"}</td>
                <td className="p-2">{d.priority ?? "—"}</td>
                <td className="p-2 text-muted-foreground">{d.updatedAt.toISOString().slice(0, 16)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deals.length === 0 ?
        <p className="text-muted-foreground">No deals match filters.</p>
      : null}
    </div>
  );
}
