import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { NotificationList, type NotificationRow } from "@/components/notifications/NotificationList";

export const dynamic = "force-dynamic";

export default async function NotificationsCenterPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const rows = await prisma.notification.findMany({
    where: {
      userId,
      status: { in: ["UNREAD", "READ"] },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const initial: NotificationRow[] = rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    status: n.status,
    priority: n.priority,
    actionUrl: n.actionUrl,
    actionLabel: n.actionLabel,
    createdAt: n.createdAt.toISOString(),
  }));

  const demo = process.env.NEXT_PUBLIC_ENV === "staging";

  return (
    <HubLayout
      title="Notifications"
      hubKey="realEstate"
      navigation={hubNavigation.realEstate}
      showAdminInSwitcher={user?.role === "ADMIN"}
    >
      <div className="space-y-6 text-slate-100">
        <div>
          <p className="text-lg text-slate-200">
            Stay up to date on messages, offers, contracts, documents, and appointments.
          </p>
          {demo ? (
            <p className="mt-2 text-sm text-amber-200/90">
              This is a demo notification environment. Actions and reminders are for testing only.
            </p>
          ) : null}
        </div>
        <NotificationList
          initial={initial}
          defaultTab={user?.role === "ADMIN" ? "all" : "unread"}
        />
      </div>
    </HubLayout>
  );
}
