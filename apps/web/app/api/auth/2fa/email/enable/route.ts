import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";

/** POST — enable email 2FA for the signed-in user (optional opt-in). */
export async function POST() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEmailEnabled: true },
  });
  return NextResponse.json({ ok: true });
}
