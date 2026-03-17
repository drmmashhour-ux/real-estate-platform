import Link from "next/link";
import { getListingsPendingVerification } from "@/lib/bnhub/verification";
import { ModerationQueueClient } from "./moderation-queue-client";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage() {
  const pending = await getListingsPendingVerification();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-2xl font-semibold">Listing verification queue</h1>
        <p className="mt-1 text-slate-400">Approve or reject listings after host identity, address, photo, and ownership checks.</p>
        <ModerationQueueClient initialListings={pending} />
      </div>
    </main>
  );
}
