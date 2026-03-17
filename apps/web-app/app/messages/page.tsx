import Link from "next/link";
import { MessagesClient } from "./messages-client";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ host?: string; listing?: string }>;
}) {
  const { host, listing } = await searchParams;
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/bnhub" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Back to search
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">Messages</h1>
          <p className="mt-1 text-slate-400">Conversations with hosts about your trips.</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <MessagesClient hostId={host} listingId={listing} />
      </section>
    </main>
  );
}
