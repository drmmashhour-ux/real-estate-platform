import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";
import { headers } from "next/headers";
import type { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { LECIPM_PATH_HEADER } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/db";

const ADMIN_SURFACE_ROLES = new Set<PlatformRole>(["ADMIN", "ACCOUNTANT"]);

export { dynamic, revalidate } from "@/lib/auth/protected-route-segment";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureDynamicAuthRequest();
  const guestId = await getGuestId();
  if (!guestId) {
    const h = await headers();
    const returnPath = h.get(LECIPM_PATH_HEADER) ?? "/admin";
    redirect(`/auth/login?returnUrl=${encodeURIComponent(returnPath)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: guestId },
    select: { role: true, accountStatus: true },
  });

  if (!user || user.accountStatus !== "ACTIVE") {
    redirect("/auth/login?returnUrl=/admin");
  }

  if (!ADMIN_SURFACE_ROLES.has(user.role)) {
    redirect("/dashboard");
  }

  return children;
}
