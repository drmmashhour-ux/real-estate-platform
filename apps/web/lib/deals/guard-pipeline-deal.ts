import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import type { PlatformRole } from "@prisma/client";

export async function requireAuthUser():
  | { ok: true; userId: string; role: PlatformRole }
  | { ok: false; response: NextResponse } {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId, role: user.role };
}

export function requireBrokerOrAdmin(role: PlatformRole): boolean {
  return role === "BROKER" || role === "ADMIN";
}

export { canAccessPipelineDeal, canRecordCommitteeDecision, canSubmitToCommittee } from "@/modules/deals/deal-policy";
