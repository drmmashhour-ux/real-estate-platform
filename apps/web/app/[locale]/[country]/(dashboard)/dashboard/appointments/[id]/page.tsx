import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { canViewAppointment } from "@/modules/scheduling/services/appointment-permissions";
import type { AppointmentViewer } from "@/modules/scheduling/services/appointment-permissions";
import { AppointmentTimeline } from "@/components/scheduling/AppointmentTimeline";
import { SchedulingDemoDisclaimer, SchedulingLegalCopy } from "@/components/scheduling/SchedulingStagingCopy";
import { AppointmentDetailActions } from "./appointment-detail-actions";
import { OpenContextConversationButton } from "@/components/messaging/OpenContextConversationButton";

export const dynamic = "force-dynamic";

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAuthenticatedUser();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) notFound();
  const viewer: AppointmentViewer = user;

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: "asc" } },
      broker: { select: { id: true, name: true, email: true } },
      clientUser: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true } },
      offer: { select: { id: true, status: true } },
      contract: { select: { id: true, title: true, status: true } },
      brokerClient: { select: { id: true, fullName: true } },
    },
  });
  if (!appt) notFound();
  if (!canViewAppointment(viewer, appt)) notFound();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard/appointments" className="text-sm text-emerald-400 hover:underline">
          ← Appointments
        </Link>
        <SchedulingDemoDisclaimer />
        <SchedulingLegalCopy />
        <h1 className="text-2xl font-semibold text-white">{appt.title}</h1>
        <p className="text-sm text-slate-400">
          {appt.type.replace(/_/g, " ")} · {appt.status} · {appt.meetingMode}
        </p>
        <p className="text-sm text-slate-300">
          {appt.startsAt.toLocaleString()} – {appt.endsAt.toLocaleString()}
        </p>
        {appt.description ? <p className="text-sm text-slate-400">{appt.description}</p> : null}

        <section className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
          <h2 className="font-semibold text-white">Messaging</h2>
          <div className="mt-2">
            <OpenContextConversationButton
              contextType="appointment"
              contextId={id}
              label="Message about this appointment"
              className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-50"
            />
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
          <h2 className="font-semibold text-white">Links</h2>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>Broker: {appt.broker.name ?? appt.broker.email}</li>
            {appt.listing ? (
              <li>
                Listing:{" "}
                <Link href={`/listings/${appt.listing.id}`} className="text-emerald-400 hover:underline">
                  {appt.listing.title}
                </Link>
              </li>
            ) : null}
            {appt.offer ? <li>Offer: {appt.offer.id.slice(0, 8)}… ({appt.offer.status})</li> : null}
            {appt.contract ? <li>Contract: {appt.contract.title || appt.contract.id}</li> : null}
          </ul>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h2 className="font-semibold text-white">Timeline</h2>
          <div className="mt-3">
            <AppointmentTimeline events={appt.events} />
          </div>
        </section>

        <AppointmentDetailActions
          appointmentId={appt.id}
          status={appt.status}
          viewerRole={user.role}
          isBroker={user.role === "BROKER" && appt.brokerId === user.id}
          isAdmin={user.role === "ADMIN"}
          isClient={appt.clientUserId === user.id}
        />
      </div>
    </main>
  );
}
