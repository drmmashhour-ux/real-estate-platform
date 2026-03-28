import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";

export { dynamic, revalidate } from "@/lib/auth/protected-route-segment";

export default async function AdminLookupLayout({ children }: { children: React.ReactNode }) {
  await ensureDynamicAuthRequest();
  const id = await getGuestId();
  if (!id) redirect("/auth/login?returnUrl=/admin/lookup");
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/dashboard");
  return <>{children}</>;
}
