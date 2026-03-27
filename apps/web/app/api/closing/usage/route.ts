import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getUsageSnapshot } from "@/src/modules/closing/application/checkUsageLimit";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const snapshot = await getUsageSnapshot(userId);
  if (!snapshot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(snapshot);
}
