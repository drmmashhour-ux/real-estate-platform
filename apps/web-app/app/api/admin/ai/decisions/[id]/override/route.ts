import { NextRequest } from "next/server";
import { overrideAiDecision } from "@/lib/ai-decision-log";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const overriddenBy = body?.overriddenBy ?? "admin";
    const log = await overrideAiDecision(id, overriddenBy);
    return Response.json(log);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to override decision" }, { status: 500 });
  }
}
