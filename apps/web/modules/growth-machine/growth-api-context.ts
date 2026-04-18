import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { engineFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export function growthMachineJsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireGrowthMachineActor(): Promise<
  | { ok: false; response: NextResponse }
  | { ok: true; userId: string; role: PlatformRole }
> {
  if (!engineFlags.growthMachineV1) {
    return { ok: false, response: growthMachineJsonError("Growth Machine is disabled", 403) };
  }
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: growthMachineJsonError("Sign in required", 401) };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return { ok: false, response: growthMachineJsonError("User not found", 401) };
  }
  return { ok: true, userId, role: user.role };
}
