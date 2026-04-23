import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLookupLayout({ children }: { children: React.ReactNode }) {
  await ensureDynamicAuthRequest();
  const id = await getGuestId();
  if (!id) redirect("/auth/login?returnUrl=/admin/lookup");
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/dashboard");
  return <>{children}</>;
}
