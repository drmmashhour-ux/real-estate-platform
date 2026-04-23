import Link from "next/link";
import { prisma } from "@repo/db";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";
import { CalendarViewedTracker } from "@/components/scheduling/CalendarViewedTracker";
import { SchedulingDemoDisclaimer } from "@/components/scheduling/SchedulingStagingCopy";

export const dynamic = "force-dynamic";

export default async function BrokerCalendarPage() {
  const user = await requireBrokerOrAdminPage("/dashboard/broker/calendar");
  const where = user.role === "ADMIN" ? {} : { brokerId: user.id };

  const upcoming = await prisma.appointment.findMany({
    where: {
      ...where,
      startsAt: { gte: new Date(Date.now() - 86400000) },
      status: { notIn: ["CANCELLED", "COMPLETED"] },
    },
    orderBy: { startsAt: "asc" },
    take: 80,
    include: {
      clientUser: { select: { name: true, email: true } },
      listing: { select: { title: true } },
      brokerClient: { select: { fullName: true } },
    },
  });

  return (
    <HubLayout
      title="Calendar"
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
    >
      <CalendarViewedTracker role={user.role} />
      <div className="space-y-6 text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Upcoming</h2>
            <p className="text-sm text-slate-400">Day / week views — list-first in v1.</p>
          </div>
          <Link
            href="/dashboard/broker/calendar/availability"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Availability
          </Link>
        </div>
        <SchedulingDemoDisclaimer />

        <section className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm font-semibold text-white">Week at a glance</h3>
          <p className="mt-1 text-xs text-slate-500">
            {upcoming.length} item(s) in the near horizon. Open a row for detail and actions.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {upcoming.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 border-b border-white/5 pb-2">
                <div>
                  <Link href={`/dashboard/appointments/${a.id}`} className="font-medium text-emerald-300 hover:underline">
                    {a.title}
                  </Link>
                  <span className="ml-2 text-xs text-slate-500">{a.type.replace(/_/g, " ")}</span>
                  <p className="text-xs text-slate-500">
                    {a.startsAt.toLocaleString()} – {a.endsAt.toLocaleString()} · {a.status}
                  </p>
                  <p className="text-xs text-slate-600">
                    {a.clientUser?.name ?? a.brokerClient?.fullName ?? "Client"} ·{" "}
                    {a.listing?.title ? `Listing: ${a.listing.title}` : "—"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {upcoming.length === 0 ? <p className="text-sm text-slate-500">No upcoming appointments.</p> : null}
        </section>
      </div>
    </HubLayout>
  );
}
