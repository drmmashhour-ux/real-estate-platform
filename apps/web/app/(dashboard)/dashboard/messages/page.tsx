import { Suspense } from "react";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { MessagesPageClient } from "@/components/messaging/MessagesPageClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const { userId } = await requireAuthenticatedUser();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-2xl font-semibold text-white">Messages</h1>
        <Suspense fallback={<p className="text-sm text-slate-500">Loading conversations…</p>}>
          <MessagesPageClient viewerId={userId} />
        </Suspense>
      </div>
    </main>
  );
}
