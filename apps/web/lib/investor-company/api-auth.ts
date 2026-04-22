import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";
import { getGuestId } from "@/lib/auth/session";
import { PlatformRole } from "@prisma/client";
import { canViewCompanyInvestorDashboard } from "./access";

export type CompanyInvestorApiCtx = {
  userId: string;
  role: PlatformRole;
};

type AuthFailure = { ok: false; response: NextResponse };
type AuthSuccess = { ok: true; ctx: CompanyInvestorApiCtx };

export async function requireCompanyInvestorApiAuth(): Promise<AuthFailure | AuthSuccess> {
  await ensureDynamicAuthRequest();
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || !canViewCompanyInvestorDashboard(user.role)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, ctx: { userId, role: user.role } };
}
