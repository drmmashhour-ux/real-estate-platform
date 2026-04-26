import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { countUnreadLecipmBrokerInbox, countUnreadLecipmCustomerInbox } from "@/lib/messages/unread-count";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ brokerUnread: 0, customerUnread: 0 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ brokerUnread: 0, customerUnread: 0 });
  }

  let brokerUnread = 0;
  if (user.role === "BROKER") {
    brokerUnread = await countUnreadLecipmBrokerInbox(userId);
  } else if (user.role === "ADMIN") {
    brokerUnread = await prisma.lecipmBrokerListingMessage.count({
      where: {
        isRead: false,
        senderRole: { in: ["customer", "guest"] },
      },
    });
  }

  const customerUnread = await countUnreadLecipmCustomerInbox(userId);

  return NextResponse.json({ brokerUnread, customerUnread });
}
