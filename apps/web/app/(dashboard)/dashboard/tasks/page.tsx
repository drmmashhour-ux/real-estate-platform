import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { ActionQueueList } from "@/components/notifications/ActionQueueList";
import type { ActionQueueRow } from "@/components/notifications/ActionQueueItemCard";

export const dynamic = "force-dynamic";

export default async function ActionQueuePage(props: {
  searchParams?: Promise<{ overdue?: string; dueToday?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const filter =
    sp.overdue === "1" ? "overdue" : sp.dueToday === "1" ? "dueToday" : "open";

  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const items = await prisma.actionQueueItem.findMany({
    where: { userId, status: { in: ["OPEN", "IN_PROGRESS"] } },
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: 80,
  });

  const initial: ActionQueueRow[] = items.map((i) => ({
    id: i.id,
    type: i.type,
    title: i.title,
    description: i.description,
    status: i.status,
    priority: i.priority,
    dueAt: i.dueAt?.toISOString() ?? null,
    sourceType: i.sourceType,
    sourceId: i.sourceId,
    actionUrl: i.actionUrl,
    createdAt: i.createdAt.toISOString(),
  }));

  const demo = process.env.NEXT_PUBLIC_ENV === "staging";

  return (
    <HubLayout
      title="Tasks"
      hubKey="realEstate"
      navigation={hubNavigation.realEstate}
      showAdminInSwitcher={user?.role === "ADMIN"}
    >
      <div className="space-y-6 text-slate-100">
        <div>
          <p className="text-lg text-slate-200">
            Your action queue shows the next items that need your attention.
          </p>
          {demo ? (
            <p className="mt-2 text-sm text-amber-200/90">
              This is a demo notification environment. Actions and reminders are for testing only.
            </p>
          ) : null}
        </div>
        <section className="rounded-xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-sm font-semibold text-white">Open actions</h2>
          <div className="mt-4">
            <ActionQueueList initial={initial} filter={filter} />
          </div>
        </section>
      </div>
    </HubLayout>
  );
}
