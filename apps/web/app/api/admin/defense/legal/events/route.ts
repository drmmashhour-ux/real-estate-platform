import { NextRequest } from "next/server";
import { getLegalEventLog } from "@/lib/defense/legal-records";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const events = await getLegalEventLog({
      eventType: searchParams.get("eventType") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
      entityType: searchParams.get("entityType") ?? undefined,
      entityId: searchParams.get("entityId") ?? undefined,
      from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100,
    });
    return Response.json(events);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get legal events" }, { status: 500 });
  }
}
