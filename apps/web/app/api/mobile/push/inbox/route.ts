import { requireBrokerPushEnabled, requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import { prisma } from "@repo/db";
import { mapMobileNotification } from "@/lib/bnhub/mobile-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  const disabled = requireBrokerPushEnabled();
  if (disabled) return disabled;

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "1";

  const rows = await prisma.notification.findMany({
    where: {
      userId: auth.user.id,
      status: unreadOnly ? "UNREAD" : { in: ["UNREAD", "READ"] },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const brokerRows = rows.filter((n) => {
    const m = n.metadata as { brokerMobile?: boolean } | null;
    return m?.brokerMobile === true;
  });

  return Response.json({
    kind: "broker_push_inbox_v1",
    notifications: brokerRows.map(mapMobileNotification),
  });
}
