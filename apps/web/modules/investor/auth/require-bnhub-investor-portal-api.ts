import { PlatformRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { getInvestorByEmail } from "@/modules/investor/auth/investor-auth";
import type { InvestorAccess } from "@prisma/client";

export type BnhubInvestorPortalApiOk = {
  ok: true;
  investor: InvestorAccess;
  email: string;
};

export type BnhubInvestorPortalApiFail = {
  ok: false;
  response: NextResponse;
};

/**
 * BNHub investor portal APIs: session user must be `INVESTOR` and have an **active** `InvestorAccess` row
 * keyed by the same email.
 */
export async function requireBnhubInvestorPortalAccessApi(): Promise<BnhubInvestorPortalApiOk | BnhubInvestorPortalApiFail> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });

  if (!user?.email || user.role !== PlatformRole.INVESTOR) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const investor = await getInvestorByEmail(user.email);
  if (!investor?.isActive) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true, investor, email: user.email };
}
