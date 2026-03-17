import { NextRequest } from "next/server";
import { acknowledgeAiAlert } from "@/lib/ai-marketplace-health";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const acknowledgedBy = body?.acknowledgedBy ?? "admin";
    const alert = await acknowledgeAiAlert(id, acknowledgedBy);
    return Response.json(alert);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to acknowledge alert" }, { status: 500 });
  }
}
