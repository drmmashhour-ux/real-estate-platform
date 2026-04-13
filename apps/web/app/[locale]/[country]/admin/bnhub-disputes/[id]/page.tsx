import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { BnhubDisputeDetailClient } from "./BnhubDisputeDetailClient";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminBnhubDisputeDetailPage({ params }: PageProps) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/admin/bnhub-disputes");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/dashboard");
  const role = await getUserRole();
  const { id } = await params;

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      listing: { select: { title: true, city: true } },
      booking: {
        select: {
          checkIn: true,
          checkOut: true,
          guest: { select: { name: true, email: true } },
        },
      },
      messages: { orderBy: { createdAt: "asc" }, take: 40 },
    },
  });
  if (!dispute) notFound();

  const bookingMessages = await prisma.bookingMessage.findMany({
    where: { bookingId: dispute.bookingId },
    orderBy: { createdAt: "asc" },
    take: 40,
    include: { sender: { select: { name: true, email: true } } },
  });

  const checklist = await prisma.bnhubBookingChecklistItem.findMany({
    where: { bookingId: dispute.bookingId },
    orderBy: { itemKey: "asc" },
  });

  return (
    <HubLayout title="Dispute detail" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-6">
        <Link href="/admin/bnhub-disputes" className="text-sm text-premium-gold hover:underline">
          ← All BNHUB disputes
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">{dispute.listing.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {dispute.listing.city} · {dispute.claimant} · {dispute.status}
          </p>
          <p className="mt-4 text-sm text-slate-300 whitespace-pre-wrap">{dispute.description}</p>
        </div>

        <BnhubDisputeDetailClient
          disputeId={dispute.id}
          initialAiRecommendation={dispute.aiAssistantRecommendation}
          initialAiSummary={
            dispute.aiAssistantSummary
              ? dispute.aiAssistantSummary
              : null
          }
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 p-4">
            <h2 className="text-sm font-semibold text-premium-gold">Booking messages</h2>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              {bookingMessages.map((m) => (
                <li key={m.id} className="border-b border-white/5 pb-2">
                  <span className="text-slate-500">{m.createdAt.toISOString().slice(0, 16)}</span> —{" "}
                  {m.sender.name ?? m.sender.email ?? m.senderId}:{" "}
                  <span className="text-slate-300">{m.body}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-white/10 p-4">
            <h2 className="text-sm font-semibold text-premium-gold">Checklist</h2>
            <ul className="mt-3 space-y-1 text-xs">
              {checklist.map((c) => (
                <li key={c.id} className="text-slate-400">
                  {c.label ?? c.itemKey}: {c.confirmed === true ? "✓" : c.confirmed === false ? "✗" : "—"}
                  {c.note ? ` — ${c.note}` : ""}
                </li>
              ))}
              {checklist.length === 0 ? <li className="text-slate-500">No checklist rows.</li> : null}
            </ul>
          </section>
        </div>

        <section className="rounded-2xl border border-white/10 p-4">
          <h2 className="text-sm font-semibold text-premium-gold">Dispute thread</h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-400">
            {dispute.messages.map((m) => (
              <li key={m.id}>
                {m.createdAt.toISOString().slice(0, 16)} — {m.body}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </HubLayout>
  );
}
