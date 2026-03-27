import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { PlatformRole } from "@prisma/client";

export type BrokerApiSession = { id: string; role: PlatformRole };

export async function requireBrokerOrAdminApi(): Promise<
  { ok: true; session: BrokerApiSession } | { ok: false; response: NextResponse }
> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Broker or admin access required" }, { status: 403 }),
    };
  }
  return { ok: true, session: { id: user.id, role: user.role } };
}
