import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { verifyUserIdentityForBnhub } from "@/src/modules/bnhub/application/verificationService";

export async function POST() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const user = await verifyUserIdentityForBnhub(userId);
    return NextResponse.json({ user, badge: "verified" });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

