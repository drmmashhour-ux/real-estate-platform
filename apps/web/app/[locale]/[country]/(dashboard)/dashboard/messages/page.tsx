import { Suspense } from "react";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { BrokerMessagesTabs } from "@/components/messaging/BrokerMessagesTabs";
import { MessagesPageClient } from "@/components/messaging/MessagesPageClient";
import { prisma } from "@/lib/db";
import { countUnreadLecipmBrokerInbox } from "@/lib/messages/unread-count";

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ lecipmThread?: string }>;
}) {
  const { lecipmThread } = await searchParams;
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const useBrokerTabs = user?.role === "BROKER" || user?.role === "ADMIN";
  const viewerRole = user?.role;
  let listingInboxUnread = 0;
  if (user?.role === "BROKER") {
    listingInboxUnread = await countUnreadLecipmBrokerInbox(userId);
  } else if (user?.role === "ADMIN") {
    listingInboxUnread = await prisma.lecipmBrokerListingMessage.count({
      where: { isRead: false, senderRole: { in: ["customer", "guest"] } },
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 flex flex-wrap items-center gap-2 text-2xl font-semibold text-white">
          Messages
          {useBrokerTabs && listingInboxUnread > 0 ? (
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
              {listingInboxUnread} listing inquiry{listingInboxUnread === 1 ? "" : "ies"}
            </span>
          ) : null}
        </h1>
        <p className="mb-4 max-w-2xl text-sm text-slate-400">
          Communication center — LECIPM connects, guides, and optimizes every real estate interaction.
        </p>
        <Suspense fallback={<p className="text-sm text-slate-500">Loading conversations…</p>}>
          {useBrokerTabs ? (
            <BrokerMessagesTabs
              viewerId={userId}
              initialLecipmThreadId={lecipmThread?.trim() || undefined}
            />
          ) : (
            <MessagesPageClient viewerId={userId} />
          )}
        </Suspense>
        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-slate-500">
          Messaging requires an account and respects your notification preferences. Automated follow-ups are
          frequency-capped; AI drafts must be reviewed before sending (Quebec Law 25 — avoid unnecessary personal data).
        </p>
      </div>
    </main>
  );
}
