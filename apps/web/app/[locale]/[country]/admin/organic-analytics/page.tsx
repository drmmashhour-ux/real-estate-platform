import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { OrganicAnalyticsClient } from "./organic-analytics-client";

export const dynamic = "force-dynamic";

export default async function AdminOrganicAnalyticsPage() {
  const id = await getGuestId();
  if (!id) redirect("/login?next=/admin/organic-analytics");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/admin" className="text-sm font-medium text-premium-gold hover:text-premium-gold">
          ← Admin
        </Link>
        <header className="mt-6 border-b border-white/10 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
            Organic &amp; social
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Organic analytics</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
            Tag links with <code className="text-premium-gold">?source=facebook|instagram|whatsapp|direct</code> and optional{" "}
            <code className="text-premium-gold">?campaign=</code>. First-touch cookie feeds leads and engagement events — no
            change to evaluation, CRM, Stripe, or booking.
          </p>
        </header>
        <div className="mt-8">
          <OrganicAnalyticsClient />
        </div>
      </div>
    </main>
  );
}
