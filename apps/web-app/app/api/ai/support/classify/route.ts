import { NextRequest } from "next/server";
import { classifySupportTicket } from "@/lib/ai-support";

export const dynamic = "force-dynamic";

/** POST /api/ai/support/classify – classify ticket for routing and priority. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await classifySupportTicket({
      subject: body?.subject,
      body: body?.body ?? "",
      entityType: body?.entityType,
      entityId: body?.entityId,
    });
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to classify ticket" }, { status: 500 });
  }
}
