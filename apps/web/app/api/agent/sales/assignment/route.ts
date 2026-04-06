import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { updateAssignmentStatus } from "@/src/modules/sales/performance";
import type { AssignmentStatus } from "@/src/modules/sales/constants";
import { ASSIGNMENT_STATUS } from "@/src/modules/sales/constants";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as { leadId?: string; status?: string };
  if (!b.leadId || !b.status) return Response.json({ error: "leadId and status required" }, { status: 400 });
  if (!ASSIGNMENT_STATUS.includes(b.status as AssignmentStatus)) {
    return Response.json({ error: "invalid status" }, { status: 400 });
  }

  try {
    const row = await updateAssignmentStatus(b.leadId, uid, b.status as AssignmentStatus);
    return Response.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "update failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
