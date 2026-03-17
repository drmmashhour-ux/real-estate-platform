import { NextRequest } from "next/server";
import { addDisputeMessage, getDisputeMessages } from "@/lib/bnhub/disputes";

/** GET: message thread for dispute. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const includeInternal = _request.nextUrl.searchParams.get("internal") === "true";
    const messages = await getDisputeMessages(id, includeInternal);
    return Response.json(messages);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

/** POST: add message to dispute thread. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const senderId = body?.senderId;
    const bodyText = body?.body;
    const isInternal = body?.isInternal === true;
    if (!senderId || typeof bodyText !== "string" || !bodyText.trim()) {
      return Response.json({ error: "senderId and body required" }, { status: 400 });
    }
    const message = await addDisputeMessage({
      disputeId: id,
      senderId,
      body: bodyText.trim(),
      isInternal,
    });
    return Response.json(message);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to add message" }, { status: 500 });
  }
}
