import type { ReactNode } from "react";

import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

import { LecipmConsoleShell } from "@/components/dashboard/LecipmConsoleShell";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";

/** LECIPM Command Center shell under `/dashboard/lecipm` — role-aware navigation + Classic escape. */
export default async function LecipmConsoleLayout({ children }: { children: ReactNode }) {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return <LecipmConsoleShell userRole={user?.role ?? "USER"}>{children}</LecipmConsoleShell>;
}
