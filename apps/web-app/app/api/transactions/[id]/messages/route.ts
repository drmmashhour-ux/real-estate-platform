import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { sendTransactionMessage } from "@/lib/transactions/messages";

/**
 * POST /api/transactions/:id/messages
 * Body: message
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const message = (body.message as string)?.trim();

    if (!id || !message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const result = await sendTransactionMessage(id, userId, message);
    return Response.json({ message_id: result.messageId });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Send message failed" },
      { status: 500 }
    );
  }
}
