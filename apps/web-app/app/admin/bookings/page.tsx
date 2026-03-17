import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminBookingsClient } from "./admin-bookings-client";

export const dynamic = "force-dynamic";

export default async function AdminBookingsReviewPage() {
  const bookings = await prisma.booking.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, city: true, ownerId: true } },
      guest: { select: { id: true, name: true, email: true } },
      payment: { select: { status: true, amountCents: true } },
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-2xl font-semibold">BNHub bookings review</h1>
        <p className="mt-1 text-slate-400">Review recent and suspicious bookings. Use moderation and fraud tools for actions.</p>
        <AdminBookingsClient bookings={bookings} />
      </div>
    </main>
  );
}
