import { NextRequest } from "next/server";
import { getControlAuditLog } from "@/lib/operational-controls";

export const dynamic = "force-dynamic";

/** GET: recent control action audit log. */
export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get("limit");
    const log = await getControlAuditLog(limit ? parseInt(limit, 10) : 50);
    return Response.json(log);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get audit log" }, { status: 500 });
  }
}
