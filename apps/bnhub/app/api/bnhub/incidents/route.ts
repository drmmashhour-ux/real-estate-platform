import { NextRequest } from "next/server";

/**
 * Stub: submit incident report. In production this would create an incident
 * in trust & safety service and notify support.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const description = body?.description;
    if (!description || typeof description !== "string" || !description.trim()) {
      return Response.json(
        { error: "description required" },
        { status: 400 }
      );
    }
    // TODO: integrate with trust-safety-service, persist incident, notify support
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to submit incident" }, { status: 500 });
  }
}
