import Link from "next/link";
import { getAllDisputes } from "@/lib/bnhub/disputes";
import { DisputesListClient } from "./disputes-list-client";

export const dynamic = "force-dynamic";

export default async function AdminDisputesPage() {
  const disputes = await getAllDisputes();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-2xl font-semibold">Disputes</h1>
        <p className="mt-1 text-slate-400">Review and resolve guest/host disputes.</p>
        <DisputesListClient initialDisputes={disputes} />
      </div>
    </main>
  );
}
