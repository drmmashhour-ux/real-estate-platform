import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export async function requireAgentsSession(): Promise<
  | { ok: true; userId: string; role: string }
  | { ok: false; response: NextResponse }
> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, userId, role: user.role };
}
