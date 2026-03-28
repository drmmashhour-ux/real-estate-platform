import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  assignBroker,
  markAsHot,
  markAsLost,
  pushBooking,
  sendMessage,
} from "@/src/modules/crm/actionEngine";

export const dynamic = "force-dynamic";

type Body = {
  action: "send_message" | "assign_broker" | "push_booking" | "mark_hot" | "mark_lost";
  leadId: string;
  brokerUserId?: string;
  note?: string;
  reason?: string;
};

export async function POST(req: Request) {
  const guestId = await getGuestId();
  if (!guestId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({
    where: { id: guestId },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
  if (!leadId) return Response.json({ error: "leadId required" }, { status: 400 });

  switch (body.action) {
    case "send_message":
      await sendMessage(leadId, body.note);
      break;
    case "assign_broker": {
      const bid = typeof body.brokerUserId === "string" ? body.brokerUserId.trim() : "";
      if (!bid) return Response.json({ error: "brokerUserId required" }, { status: 400 });
      await assignBroker(leadId, bid);
      break;
    }
    case "push_booking":
      await pushBooking(leadId, body.note);
      break;
    case "mark_hot":
      await markAsHot(leadId);
      break;
    case "mark_lost":
      await markAsLost(leadId, body.reason);
      break;
    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  return Response.json({ ok: true });
}
