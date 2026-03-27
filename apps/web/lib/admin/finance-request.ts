import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { isFinancialStaff } from "./finance-access";
import type { PlatformRole, User } from "@prisma/client";

const GUEST_COOKIE = "lecipm_guest_id";

export async function getFinanceActor(): Promise<{ user: User; role: PlatformRole } | null> {
  const c = await cookies();
  const userId = c.get(GUEST_COOKIE)?.value ?? null;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !isFinancialStaff(user.role)) return null;
  return { user, role: user.role };
}
