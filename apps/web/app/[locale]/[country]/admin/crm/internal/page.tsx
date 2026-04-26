import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { HubLayout } from "@/components/hub/HubLayout";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { hubNavigation } from "@/lib/hub/navigation";
import { LeadAiRefreshButton } from "./LeadAiRefreshButton";

export const dynamic = "force-dynamic";

export default async function AdminInternalCrmPage() {
  const guestId = await getGuestId();
  if (!guestId) redirect("/auth/login?returnUrl=/admin/crm/internal");
  const user = await prisma.user.findUnique({
    where: { id: guestId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect("/admin/dashboard");
  const role = await getUserRole();

  const since24h = new Date();
  since24h.setUTCDate(since24h.getUTCDate() - 1);

  const [events, bnhubLinkedLeads, eventCounts, pendingJobs] = await Promise.all([
    prisma.internalCrmEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { email: true } },
        lead: { select: { id: true, name: true, aiTier: true, email: true } },
        shortTermListing: { select: { title: true, listingCode: true, city: true } },
        booking: { select: { id: true, confirmationCode: true, status: true } },
      },
    }),
    prisma.lead.findMany({
      where: {
        OR: [
          { shortTermListingId: { not: null } },
          { leadSource: { contains: "bnhub", mode: "insensitive" } },
          { leadSource: { contains: "immo", mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        leadSource: true,
        aiTier: true,
        score: true,
        scoreLevel: true,
        highIntent: true,
        engagementScore: true,
        lecipmLeadScore: true,
        pipelineStatus: true,
        shortTermListingId: true,
        bnhubStayForLead: { select: { title: true, listingCode: true, city: true } },
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.internalCrmEvent.groupBy({
      by: ["eventType"],
      where: { createdAt: { gte: since24h } },
      _count: { id: true },
    }),
    prisma.leadFollowUpJob.count({
      where: { status: "pending" },
    }),
  ]);

  const hotCount = bnhubLinkedLeads.filter((l) => l.aiTier === "hot" || (l.score ?? 0) >= 75).length;

  return (
    <HubLayout
      title="Internal CRM — BNHUB + LECIPM"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-8 text-sm text-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-white">Unified CRM telemetry</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Platform <code className="text-slate-300">Lead</code> rows plus{" "}
            <code className="text-slate-300">internal_crm_events</code> (views, clicks, paid bookings). Automated email
            follow-up uses <code className="text-slate-300">LeadFollowUpJob</code> +{" "}
            <code className="text-slate-300">POST /api/cron/follow-up-jobs</code> (SMS/voice jobs unchanged). Tie guests
            to leads by setting <code className="text-slate-300">Lead.userId</code> and{" "}
            <code className="text-slate-300">Lead.shortTermListingId</code> when capturing BNHUB inquiries.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Hot / warm (this list)</p>
            <p className="mt-1 text-2xl font-semibold text-premium-gold">{hotCount}</p>
            <p className="text-xs text-slate-500">aiTier=hot or score ≥ 75</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Telemetry (24h)</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {eventCounts.reduce((a, b) => a + b._count.id, 0)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pending follow-up jobs</p>
            <p className="mt-1 text-2xl font-semibold text-white">{pendingJobs}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Broker CRM</p>
            <Link href="/dashboard/leads" className="mt-2 inline-block text-premium-gold hover:underline">
              Open /dashboard/leads →
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">BNHUB-linked leads</h2>
          <p className="mt-1 text-xs text-slate-500">
            AI tier uses rule-based automation (<code className="text-slate-400">refreshLeadAutomationScoring</code>) plus
            engagement bumps from telemetry. Re-score refreshes LECIPM composite when FSBO context exists.
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead className="border-b border-white/10 bg-black/40 text-slate-500">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Stay</th>
                  <th className="p-2">Tier</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Eng</th>
                  <th className="p-2">Source</th>
                  <th className="p-2 w-24">AI</th>
                </tr>
              </thead>
              <tbody>
                {bnhubLinkedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-slate-500">
                      No leads with BNHUB short-term link or bnhub/immo source yet.
                    </td>
                  </tr>
                ) : (
                  bnhubLinkedLeads.map((l) => (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="p-2">
                        <div className="font-medium text-white">{l.name}</div>
                        <div className="text-slate-500">{l.email}</div>
                      </td>
                      <td className="p-2 text-slate-400">
                        {l.bnhubStayForLead?.listingCode ?? "—"}
                        <div className="text-slate-500">{l.bnhubStayForLead?.title ?? ""}</div>
                      </td>
                      <td className="p-2">
                        <span
                          className={
                            l.aiTier === "hot"
                              ? "text-red-300"
                              : l.aiTier === "warm"
                                ? "text-amber-200"
                                : "text-slate-400"
                          }
                        >
                          {l.aiTier ?? "—"}
                        </span>
                        {l.highIntent ? <span className="ml-1 text-emerald-400">· hi</span> : null}
                      </td>
                      <td className="p-2">
                        {l.score}
                        {l.scoreLevel ? <span className="text-slate-500"> / {l.scoreLevel}</span> : null}
                      </td>
                      <td className="p-2">{l.engagementScore}</td>
                      <td className="p-2 text-slate-500">{l.leadSource ?? "—"}</td>
                      <td className="p-2">
                        <LeadAiRefreshButton leadId={l.id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent interactions</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="border-b border-white/10 bg-black/40 text-slate-500">
                <tr>
                  <th className="p-2">Time</th>
                  <th className="p-2">Event</th>
                  <th className="p-2">Channel</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Lead</th>
                  <th className="p-2">Listing / booking</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-slate-500">
                      No telemetry rows yet. BNHUB listing views (signed-in) and paid bookings populate this table.
                    </td>
                  </tr>
                ) : (
                  events.map((e) => (
                    <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="p-2 whitespace-nowrap text-slate-500">
                        {e.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                      </td>
                      <td className="p-2 font-mono text-slate-300">{e.eventType}</td>
                      <td className="p-2 text-slate-500">{e.channel}</td>
                      <td className="p-2 text-slate-500">{e.user?.email ?? e.userId ?? "—"}</td>
                      <td className="p-2">
                        {e.lead ? (
                          <span>
                            {e.lead.name}{" "}
                            <span className="text-slate-500">({e.lead.aiTier ?? "?"})</span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-2 text-slate-400">
                        {e.shortTermListing?.listingCode ?? "—"}{" "}
                        {e.booking?.confirmationCode ? <span>· {e.booking.confirmationCode}</span> : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-400">Event mix (24h)</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {eventCounts.map((r) => (
              <li key={r.eventType} className="rounded-md bg-white/5 px-2 py-1">
                {r.eventType}: <span className="text-white">{r._count.id}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </HubLayout>
  );
}
