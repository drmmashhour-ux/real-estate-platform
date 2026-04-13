import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { LecipmCustomerMessagesClient } from "@/components/messaging/LecipmCustomerMessagesClient";
import { countUnreadLecipmCustomerInbox } from "@/lib/messages/unread-count";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

export default async function AccountMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ threadId?: string }>;
}) {
  const { threadId } = await searchParams;
  const userId = await getGuestId();
  if (!userId) {
    redirect("/auth/login?next=/account/messages");
  }

  const unread = await countUnreadLecipmCustomerInbox(userId);
  const initialThreadId = threadId?.trim() || undefined;

  return (
    <main className="min-h-screen bg-[#070707] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold text-white" style={{ color: GOLD }}>
          Inbox
          {unread > 0 ? (
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
              {unread} new
            </span>
          ) : null}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Your conversations with listing brokers. The broker will reply as soon as possible.
        </p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur md:p-6">
          <LecipmCustomerMessagesClient initialThreadId={initialThreadId} />
        </div>
      </div>
    </main>
  );
}
