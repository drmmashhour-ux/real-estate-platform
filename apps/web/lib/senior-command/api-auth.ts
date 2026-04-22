import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";
import { getGuestId } from "@/lib/auth/session";
import {
  canAccessSeniorCommandCenter,
  canMutateSeniorCommandOps,
  canMutateSeniorCommandPricing,
  type SeniorCommandAccessTier,
  seniorCommandAccessTier,
} from "@/lib/senior-command/access";
import type { PlatformRole } from "@prisma/client";

export type SeniorCommandApiCtx = {
  userId: string;
  role: PlatformRole;
  tier: SeniorCommandAccessTier;
};

type AuthFailure = { ok: false; response: NextResponse };
type AuthSuccess = { ok: true; ctx: SeniorCommandApiCtx };

/** JSON-safe auth for `/api/senior/command/*` — no redirects. */
export async function seniorCommandAuth(): Promise<AuthFailure | AuthSuccess> {
  await ensureDynamicAuthRequest();
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || !canAccessSeniorCommandCenter(user.role)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const tier = seniorCommandAccessTier(user.role);
  return {
    ok: true,
    ctx: { userId, role: user.role, tier },
  };
}

export function canPricing(ctx: SeniorCommandApiCtx): boolean {
  return canMutateSeniorCommandPricing(ctx.role);
}

export function canOps(ctx: SeniorCommandApiCtx): boolean {
  return canMutateSeniorCommandOps(ctx.role);
}
