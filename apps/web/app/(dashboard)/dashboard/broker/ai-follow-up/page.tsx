import Link from "next/link";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function BrokerAiFollowUpPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login");
  const role = (await getUserRole()) ?? "";
  const r = role.toUpperCase();
  if (r !== "BROKER" && r !== "ADMIN") redirect("/dashboard/real-estate");

  const leadWhere =
    r === "ADMIN"
      ? {}
      : {
          OR: [{ introducedByBrokerId: userId }, { lastFollowUpByBrokerId: userId }],
        };

  const leads = await prisma.lead.findMany({
    where: leadWhere,
    select: { id: true },
  });
  const ids = leads.map((l) => l.id);

  const metrics = {
    hotNeedingCallback: 0,
    aiContactedCount: 0,
    awaitingHuman: 0,
    voiceQueued: 0,
    totalLeads: leads.length,
  };

  if (ids.length) {
    const baseLeads = await prisma.lead.findMany({
      where: { id: { in: ids } },
      select: { score: true, aiTier: true, pipelineStatus: true, optedOutOfFollowUp: true },
    });
    metrics.hotNeedingCallback = baseLeads.filter(
      (l) =>
        !l.optedOutOfFollowUp &&
        (l.aiTier === "hot" || l.score >= 75) &&
        ["new", "contacted", "awaiting_reply"].includes(l.pipelineStatus)
    ).length;
    metrics.awaitingHuman = baseLeads.filter((l) => l.pipelineStatus === "awaiting_reply").length;
    const grouped = await prisma.leadCommMessage.groupBy({
      by: ["leadId"],
      where: { leadId: { in: ids }, direction: "outbound" },
    });
    metrics.aiContactedCount = grouped.length;
    metrics.voiceQueued = await prisma.leadCommMessage.count({
      where: { leadId: { in: ids }, channel: "voice", status: "queued" },
    });
  }

  return (
    <HubLayout title="AI follow-up" hubKey="broker" navigation={hubNavigation.broker} showAdminInSwitcher={r === "ADMIN"}>
      <div className="mx-auto max-w-4xl space-y-8 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">AI follow-up &amp; SMS</h1>
          <p className="mt-2 text-sm text-slate-400">
            Fast lead touches via SMS/WhatsApp (when configured), voice queue for hot + consented leads, and CRM
            timeline. AI never acts as a licensed broker.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-200/90">Hot — needs callback</p>
            <p className="mt-2 text-3xl font-bold text-amber-100">{metrics.hotNeedingCallback}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Contacted by AI (SMS/WA)</p>
            <p className="mt-2 text-3xl font-bold text-slate-100">{metrics.aiContactedCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Awaiting human follow-up</p>
            <p className="mt-2 text-3xl font-bold text-slate-100">{metrics.awaitingHuman}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Voice queued</p>
            <p className="mt-2 text-3xl font-bold text-slate-100">{metrics.voiceQueued}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-400">
          <p className="font-medium text-slate-200">CRM timeline</p>
          <p className="mt-2">
            Open any lead in{" "}
            <Link href="/dashboard/leads" className="text-emerald-400 hover:underline">
              Leads
            </Link>{" "}
            and call{" "}
            <code className="rounded bg-slate-800 px-1 text-xs">GET /api/leads/[id]/timeline</code> for events +
            messages.
          </p>
          <p className="mt-2">
            Cron: <code className="rounded bg-slate-800 px-1 text-xs">POST /api/cron/follow-up-jobs</code> with{" "}
            <code className="rounded bg-slate-800 px-1 text-xs">Authorization: Bearer CRON_SECRET</code>.
          </p>
        </div>
      </div>
    </HubLayout>
  );
}
