import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/**
 * Unified mobile inbox — latest in-app notifications for the authenticated user.
 */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "1";
  const take = Math.min(Number(searchParams.get("limit") ?? "60") || 60, 120);

  const rows = await prisma.notification.findMany({
    where: {
      userId: auth.id,
      status: unreadOnly ? "UNREAD" : { in: ["UNREAD", "READ"] },
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      message: true,
      priority: true,
      status: true,
      actionUrl: true,
      actionLabel: true,
      createdAt: true,
    },
  });

  return Response.json({
    kind: "mobile_inbox_v1",
    notifications: rows.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      priority: n.priority,
      status: n.status,
      actionUrl: n.actionUrl,
      actionLabel: n.actionLabel,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}
