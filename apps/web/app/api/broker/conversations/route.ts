import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getBrokerConversations, getOrCreateBrokerConversation } from "@/lib/broker/collaboration";

export const dynamic = "force-dynamic";

/** GET: list my broker-to-broker conversations. */
export async function GET() {
  const brokerId = await getGuestId();
  if (!brokerId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const conversations = await getBrokerConversations(brokerId);
    return Response.json(conversations);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to list conversations" }, { status: 500 });
  }
}

/** POST: get or create conversation with another broker. Body: { otherBrokerId }. */
export async function POST(req: NextRequest) {
  const brokerId = await getGuestId();
  if (!brokerId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const otherBrokerId = body.otherBrokerId ?? body.brokerId;
  if (!otherBrokerId || otherBrokerId === brokerId) {
    return Response.json({ error: "Valid otherBrokerId required" }, { status: 400 });
  }
  try {
    const conversation = await getOrCreateBrokerConversation(brokerId, otherBrokerId);
    return Response.json(conversation);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get or create conversation" }, { status: 500 });
  }
}
