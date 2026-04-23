import Link from "next/link";
import { Suspense } from "react";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { MessagesPageClient } from "@/components/messaging/MessagesPageClient";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export default async function MarketplaceConversationPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; conversationId: string }>;
}) {
  const { locale, country, conversationId } = await params;
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const base = `/${locale}/${country}`;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Link href={`${base}/listings`} className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Back to listings
          </Link>
        </div>
        <Suspense fallback={<p className="text-sm text-slate-500">Loading conversation…</p>}>
          <MessagesPageClient
            viewerId={userId}
            viewerRole={user?.role}
            pinnedConversationId={conversationId}
            urlSync="locale-messages-path"
            localeMessagesBasePath={`${base}/messages`}
            compactInbox
            fullInboxHref={`${base}/dashboard/messages`}
          />
        </Suspense>
      </div>
    </main>
  );
}
