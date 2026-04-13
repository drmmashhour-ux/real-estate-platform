import type { Prisma } from "@prisma/client";
import { InsuranceLeadType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export type InsuranceHubRole = "ADMIN" | "INSURANCE_BROKER";

export async function requireInsuranceHubAccess(): Promise<
  { ok: true; userId: string; role: InsuranceHubRole } | { ok: false; response: Response }
> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const r = u?.role;
  if (r === "ADMIN" || r === "INSURANCE_BROKER") {
    return { ok: true, userId, role: r };
  }
  return { ok: false, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
}

/** PROPERTY + TRAVEL leads surface in the broker hub (listings + BNHUB stays). */
export function insuranceHubBaseWhere(): Prisma.InsuranceLeadWhereInput {
  return {
    leadType: { in: [InsuranceLeadType.PROPERTY, InsuranceLeadType.TRAVEL] },
  };
}

export function insuranceHubScopedWhere(
  userId: string,
  role: InsuranceHubRole
): Prisma.InsuranceLeadWhereInput {
  const base = insuranceHubBaseWhere();
  if (role === "ADMIN") return base;
  return {
    AND: [
      base,
      {
        OR: [{ assignedBrokerUserId: null }, { assignedBrokerUserId: userId }],
      },
    ],
  };
}
