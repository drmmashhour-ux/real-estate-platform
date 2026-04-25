import { NextRequest } from "next/server";
import { updateFraudAlert } from "@/lib/bnhub/fraud";

/** PATCH: update fraud alert status (admin resolution). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const alert = await updateFraudAlert(id, {
      status: body.status,
      assignedTo: body.assignedTo,
      notes: body.notes,
      resolvedBy: body.resolvedBy,
    });
    return Response.json(alert);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update fraud alert" }, { status: 500 });
  }
}
