import { getGuestId } from "@/lib/auth/session";
import { requireBnhubHostAccess } from "@/lib/host/require-bnhub-host-access";
import { logHostAi } from "@/modules/host-ai/host-ai.logger";
import { suggestMessageReplies } from "@/modules/host-ai/messaging-assistant";

export const dynamic = "force-dynamic";

type Body = {
  guestMessage?: unknown;
  listingTitle?: unknown;
  tone?: unknown;
};

/**
 * POST /api/host/ai/message-suggest — draft replies only; host sends manually.
 */
export async function POST(req: Request) {
  const userId = await getGuestId();
  const gate = await requireBnhubHostAccess(userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const guestMessage = typeof body.guestMessage === "string" ? body.guestMessage : "";
  if (!guestMessage.trim()) {
    return Response.json({ error: "guestMessage required" }, { status: 400 });
  }

  const tone = body.tone === "friendly" ? "friendly" : "professional";
  const listingTitle = typeof body.listingTitle === "string" ? body.listingTitle : undefined;

  const result = suggestMessageReplies({ guestMessage, listingTitle, tone });

  logHostAi("message_suggestion", {
    hostId: gate.userId.slice(0, 8),
    tone,
    replyCount: result.replies.length,
  });

  return Response.json({
    ...result,
    tone,
    transparency: { draftsOnly: true, hostSends: true },
  });
}
