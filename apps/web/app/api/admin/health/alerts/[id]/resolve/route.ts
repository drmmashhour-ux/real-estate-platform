import { NextRequest } from "next/server";
import { resolveAlert } from "@/lib/observability";

export const dynamic = "force-dynamic";

/** POST: resolve an alert. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const alert = await resolveAlert(id, body.resolvedBy);
    return Response.json(alert);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to resolve alert" }, { status: 500 });
  }
}
