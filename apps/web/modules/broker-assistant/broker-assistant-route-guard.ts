import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function requireBrokerAssistantActor(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return { ok: false, response: NextResponse.json({ error: "Broker or admin required" }, { status: 403 }) };
  }
  return { ok: true, userId };
}
