import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { HubLayout } from "@/components/hub/HubLayout";
import { prisma } from "@repo/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { getTopPriorityLeads } from "@/src/modules/crm/priorityQueue";
import { findStaleHighIntentLeads } from "@/src/modules/crm/staleLeadEngine";
import { CrmLiveQuickActions } from "./CrmLiveQuickActions";

export const dynamic = "force-dynamic";

export default async function AdminCrmLivePage() {
  const guestId = await getGuestId();
  if (!guestId) redirect("/auth/login?returnUrl=/admin/crm-live");
  const user = await prisma.user.findUnique({
    where: { id: guestId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect("/admin/dashboard");
  const role = await getUserRole();

  const since24h = new Date(Date.now() - 24 * 3600 * 1000);

  const top = await getTopPriorityLeads(25);
  const events = await prisma.internalCrmEvent.findMany({
    where: { createdAt: { gte: since24h } },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      user: { select: { email: true } },
      lead: { select: { id: true, name: true } },
      booking: { select: { id: true, status: true, confirmationCode: true } },
    },
  });
  const inquiries = await prisma.lead.findMany({
    where: { createdAt: { gte: since24h } },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: { id: true, name: true, email: true, leadSource: true, intentScore: true, executionStage: true },
  });
  const stale = await findStaleHighIntentLeads(55);
  const pipelineRows = await prisma.lead.groupBy({
    by: ["executionStage"],
    where: { executionStage: { notIn: ["lost"] } },
    _count: { id: true },
  });

  const bookingHints = events.filter(
    (e) => e.eventType === "booking_started" || e.eventType === "booking_confirmed"
  );

  return (
    <HubLayout
      title="CRM Live — execution queue"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-8 text-sm text-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-white">Who to act on now</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Priority queue uses <code className="text-slate-300">priorityScore</code>,{" "}
            <code className="text-slate-300">intentScore</code>,{" "}
            <code className="text-slate-300">executionStage</code>, and open{" "}
            <code className="text-slate-300">RevenueOpportunity</code> value (revenue engine). Refreshed on internal CRM
            events, Immo chat, Stripe checkout, and execution refresh. Close Room uses{" "}
            <code className="text-slate-300">getCloseRoomCrmPayload</code> (includes{" "}
            <code className="text-slate-300">closeRoomRank</code>).
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <Link href="/admin/crm/internal" className="text-amber-200/90 underline">
              Internal CRM telemetry
            </Link>
            <Link href="/dashboard/leads" className="text-amber-200/90 underline">
              Broker leads
            </Link>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 lg:col-span-2">
            <h2 className="text-sm font-semibold text-white">A) Top priority leads</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500">
                    <th className="py-2 pr-2">Name</th>
                    <th className="py-2 pr-2">Intent</th>
                    <th className="py-2 pr-2">Stage</th>
                    <th className="py-2 pr-2">Next action</th>
                    <th className="py-2 pr-2">Pri</th>
                    <th className="py-2 pr-2">Rev ~</th>
                    <th className="py-2 pr-2">Rank</th>
                    <th className="py-2">Quick</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((row) => (
                    <tr key={row.id} className="border-b border-white/5">
                      <td className="py-2 pr-2">
                        <div className="font-medium text-white">{row.name}</div>
                        <div className="text-slate-500">{row.email}</div>
                      </td>
                      <td className="py-2 pr-2">{row.intentScore}</td>
                      <td className="py-2 pr-2 font-mono text-[11px] text-slate-300">{row.executionStage}</td>
                      <td className="py-2 pr-2 text-amber-100/90">{row.nextBestAction ?? "—"}</td>
                      <td className="py-2 pr-2">{row.priorityScore}</td>
                      <td className="py-2 pr-2 tabular-nums text-emerald-200/90">
                        {Math.round(row.openRevenueValue)}
                      </td>
                      <td className="py-2 pr-2 tabular-nums text-slate-400">
                        {row.monetizationRank.toFixed(1)}
                      </td>
                      <td className="py-2">
                        <CrmLiveQuickActions leadId={row.id} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {top.length === 0 && <p className="py-6 text-slate-500">No leads yet — run migrations + generate traffic.</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h2 className="text-sm font-semibold text-white">D) Deal pipeline (live)</h2>
              <ul className="mt-2 space-y-1 text-xs">
                {pipelineRows
                  .slice()
                  .sort((a, b) => b._count.id - a._count.id)
                  .map((r) => (
                    <li key={r.executionStage} className="flex justify-between border-b border-white/5 py-1">
                      <span className="font-mono text-slate-300">{r.executionStage}</span>
                      <span>{r._count.id}</span>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
              <h2 className="text-sm font-semibold text-amber-100">Stale high-intent (&gt;24h idle)</h2>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-amber-50/90">
                {stale.slice(0, 12).map((s) => (
                  <li key={s.leadId}>
                    {s.name} · intent {s.intentScore} · {Math.round(s.hoursIdle)}h idle
                  </li>
                ))}
              </ul>
              {stale.length === 0 && <p className="text-xs text-amber-200/60">None detected.</p>}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <h2 className="text-sm font-semibold text-white">B) Live activity (24h)</h2>
            <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto text-xs">
              {events.slice(0, 35).map((e) => (
                <li key={e.id} className="border-b border-white/5 pb-2">
                  <span className="font-mono text-slate-400">{e.eventType}</span>
                  <span className="text-slate-500"> · {e.channel}</span>
                  {e.lead && <span className="text-slate-400"> · {e.lead.name}</span>}
                  {e.booking && (
                    <span className="text-slate-400">
                      {" "}
                      · booking {e.booking.confirmationCode ?? e.booking.id.slice(0, 8)}
                    </span>
                  )}
                  <div className="text-[10px] text-slate-600">{e.createdAt.toISOString()}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <h2 className="text-sm font-semibold text-white">Bookings & inquiries (24h)</h2>
            <p className="mt-1 text-xs text-slate-500">Checkout / paid signals</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs">
              {bookingHints.map((e) => (
                <li key={e.id}>
                  {e.eventType} {e.bookingId ? `· ${e.bookingId.slice(0, 8)}` : ""}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">New inquiries</p>
            <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-xs">
              {inquiries.map((l) => (
                <li key={l.id}>
                  {l.name} · {l.leadSource ?? "—"} · stage {l.executionStage}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h2 className="text-sm font-semibold text-white">C) Quick actions (detail)</h2>
          <p className="mt-1 text-xs text-slate-500">Pick a lead from the table — or open broker CRM for full messaging.</p>
          {top[0] && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-slate-400">Top lead: {top[0].name}</p>
              <CrmLiveQuickActions leadId={top[0].id} />
            </div>
          )}
        </section>
      </div>
    </HubLayout>
  );
}
