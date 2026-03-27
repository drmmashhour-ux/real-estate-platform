import Link from "next/link";
import { getPropertyIdentityConsoleData } from "@/lib/property-identity-console-data";
import { PropertyIdentityConsoleClient } from "./property-identity-console-client";

export const dynamic = "force-dynamic";

export default async function AdminPropertyIdentitiesPage() {
  const { initialIdentities, pendingLinks } = await getPropertyIdentityConsoleData();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-2xl font-semibold">Property Identity Console</h1>
        <p className="mt-1 text-slate-400">
          Search by cadastre or address, view verification score, ownership, risk, and event history. Approve or reject listing links.
        </p>
        <PropertyIdentityConsoleClient initialIdentities={initialIdentities} pendingLinks={pendingLinks} />
      </div>
    </main>
  );
}
