import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/session";
import { listIncidents } from "@/lib/trust-safety/incident-service";
import { AdminTrustSafetyClient } from "./admin-trust-safety-client";

export const dynamic = "force-dynamic";

export default async function AdminTrustSafetyPage() {
  const role = await getUserRole();
  if (role !== "admin") redirect("/admin");

  const incidents = await listIncidents({ limit: 100 });
  const list = incidents.map((i) => ({
    id: i.id,
    incidentCategory: i.incidentCategory,
    description: i.description,
    status: i.status,
    severityLevel: i.severityLevel,
    createdAt: i.createdAt.toISOString(),
    reporterId: i.reporterId,
    reporterName: i.reporter?.name ?? null,
    reporterEmail: i.reporter?.email ?? null,
    accusedUserId: i.accusedUserId ?? null,
    accusedUserName: i.accusedUser?.name ?? null,
    listingId: i.listingId ?? null,
    listingTitle: i.listing?.title ?? null,
    listingCity: i.listing?.city ?? null,
    bookingId: i.bookingId ?? null,
    bookingRefunded: i.booking?.refunded ?? null,
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Trust & Safety</h1>
        <p className="mt-1 text-slate-400">
          Review reports (misleading listing, fraud, poor condition). Refund, warn host, or suspend account.
        </p>

        <AdminTrustSafetyClient incidents={list} />
      </div>
    </main>
  );
}
