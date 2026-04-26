import type { PlatformRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";

export async function requireExecutionActor(): Promise<
  | { ok: true; userId: string; role: PlatformRole }
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
    return { ok: false, response: NextResponse.json({ error: "User not found" }, { status: 401 }) };
  }
  if (user.role !== "BROKER" && user.role !== "ADMIN") {
    return { ok: false, response: NextResponse.json({ error: "Broker or admin role required" }, { status: 403 }) };
  }
  return { ok: true, userId, role: user.role };
}
